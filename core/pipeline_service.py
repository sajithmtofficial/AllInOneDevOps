import os
import re
import shutil
import subprocess
import tempfile
import time
import uuid
from pathlib import Path


PIPELINE_JOBS = {}


def _run(command, cwd=None, timeout=300):
    started = time.time()
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=False,
        )
        output = (result.stdout or "") + (result.stderr or "")
        return {
            "returncode": result.returncode,
            "output": output.strip(),
            "duration": round(time.time() - started, 2),
        }
    except subprocess.TimeoutExpired:
        return {
            "returncode": 124,
            "output": f"Command timed out after {timeout} seconds.",
            "duration": round(time.time() - started, 2),
        }
    except FileNotFoundError as exc:
        return {
            "returncode": 127,
            "output": f"Command not found: {exc}",
            "duration": round(time.time() - started, 2),
        }
    except Exception as exc:
        return {
            "returncode": 1,
            "output": str(exc),
            "duration": round(time.time() - started, 2),
        }


def _stage(job, name, command, cwd=None, timeout=300):
    job["stages"].append({
        "name": name,
        "status": "running",
        "logs": "",
    })

    result = _run(command, cwd=cwd, timeout=timeout)

    stage = job["stages"][-1]
    stage["logs"] = result["output"]
    stage["duration"] = result["duration"]
    stage["status"] = "success" if result["returncode"] == 0 else "failed"

    if result["returncode"] != 0:
        job["status"] = "failed"

    return result["returncode"] == 0


def _safe_image_name(job_id):
    return "allinone-cicd-" + re.sub(r"[^a-zA-Z0-9_.-]", "", job_id.lower())


def run_pipeline(repo_url, branch="main", build_docker=True):
    job_id = uuid.uuid4().hex[:12]
    job = {
        "id": job_id,
        "status": "running",
        "repository": repo_url,
        "branch": branch or "main",
        "started_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "stages": [],
    }
    PIPELINE_JOBS[job_id] = job

    workdir = Path(tempfile.mkdtemp(prefix=f"allinone_pipeline_{job_id}_"))

    try:
        ok = _stage(
            job,
            "Source Checkout",
            [
                "git",
                "clone",
                "--depth",
                "1",
                "--branch",
                branch or "main",
                repo_url,
                str(workdir),
            ],
            timeout=180,
        )

        if not ok:
            return job

        # Basic project detection for a useful build/test stage.
        if (workdir / "package.json").exists():
            ok = _stage(
                job,
                "Build / Install",
                ["npm", "install", "--no-audit", "--no-fund"],
                cwd=workdir,
                timeout=300,
            )
            if ok and (workdir / "package.json").exists():
                ok = _stage(
                    job,
                    "Test",
                    ["npm", "test", "--", "--runInBand"],
                    cwd=workdir,
                    timeout=300,
                )

        elif (workdir / "requirements.txt").exists():
            # Run Python tests in a Docker container if Docker is available.
            ok = _stage(
                job,
                "Build / Test",
                [
                    "docker", "run", "--rm",
                    "-v", f"{workdir}:/app:ro",
                    "-w", "/app",
                    "python:3.12-slim",
                    "sh", "-c",
                    "pip install -r requirements.txt -q && "
                    "python -m pytest -q"
                ],
                timeout=300,
            )

        elif list(workdir.glob("*.cpp")):
            cpp = list(workdir.glob("*.cpp"))[0]
            ok = _stage(
                job,
                "Build / Test",
                [
                    "docker", "run", "--rm",
                    "-v", f"{workdir}:/app:ro",
                    "-w", "/app",
                    "gcc:14",
                    "sh", "-c",
                    f"g++ {cpp.name} -std=c++17 -o /tmp/app && /tmp/app"
                ],
                timeout=180,
            )

        elif list(workdir.glob("*.c")):
            cfile = list(workdir.glob("*.c"))[0]
            ok = _stage(
                job,
                "Build / Test",
                [
                    "docker", "run", "--rm",
                    "-v", f"{workdir}:/app:ro",
                    "-w", "/app",
                    "gcc:14",
                    "sh", "-c",
                    f"gcc {cfile.name} -o /tmp/app && /tmp/app"
                ],
                timeout=180,
            )

        elif list(workdir.glob("*.java")):
            java = list(workdir.glob("*.java"))[0]
            classname = java.stem
            ok = _stage(
                job,
                "Build / Test",
                [
                    "docker", "run", "--rm",
                    "-v", f"{workdir}:/app:ro",
                    "-w", "/app",
                    "eclipse-temurin:21-jdk",
                    "sh", "-c",
                    f"mkdir -p /tmp/classes && javac -d /tmp/classes {java.name} "
                    f"&& java -cp /tmp/classes {classname}"
                ],
                timeout=180,
            )

        else:
            # A repository without a known build system can still pass checkout.
            job["stages"].append({
                "name": "Build / Test",
                "status": "skipped",
                "logs": "No supported project build/test configuration detected."
            })

        if job["status"] == "failed":
            return job

        if build_docker:
            dockerfile = workdir / "Dockerfile"
            if dockerfile.exists():
                image = _safe_image_name(job_id)
                ok = _stage(
                    job,
                    "Docker Build",
                    ["docker", "build", "-t", image, "."],
                    cwd=workdir,
                    timeout=600,
                )
                if ok:
                    # Remove the temporary image after a successful demonstration build.
                    _run(["docker", "rmi", "-f", image], timeout=60)
            else:
                job["stages"].append({
                    "name": "Docker Build",
                    "status": "skipped",
                    "logs": "Dockerfile not found in repository."
                })

        job["status"] = "success"
        return job

    except Exception as exc:
        job["status"] = "failed"
        job["error"] = str(exc)
        return job

    finally:
        shutil.rmtree(workdir, ignore_errors=True)


def get_job(job_id):
    return PIPELINE_JOBS.get(job_id)
