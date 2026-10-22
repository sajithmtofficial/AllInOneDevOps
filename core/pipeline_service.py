import json
import re
import shutil
import subprocess
import tempfile
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path


PIPELINE_JOBS = {}


def _now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


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
            encoding="utf-8",
            errors="replace",
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


def _add_stage(job, name, status="running", logs="", duration=None, extra=None):
    stage = {
        "name": name,
        "status": status,
        "logs": logs,
        "started_at": _now(),
        "duration": duration,
    }
    if extra:
        stage.update(extra)
    job["stages"].append(stage)
    return stage


def _stage(job, name, command, cwd=None, timeout=300, skipped_returncodes=None):
    stage = _add_stage(job, name)
    result = _run(command, cwd=cwd, timeout=timeout)

    stage["logs"] = result["output"]
    stage["duration"] = result["duration"]
    stage["exit_code"] = result["returncode"]
    stage["finished_at"] = _now()

    if skipped_returncodes and result["returncode"] in skipped_returncodes:
        stage["status"] = "skipped"
        stage["logs"] = (
            (result["output"] + "\n" if result["output"] else "")
            + "Stage skipped: the tool reported that there was nothing to run."
        )
        return True

    if result["returncode"] == 0:
        stage["status"] = "success"
        return True

    stage["status"] = "failed"
    job["status"] = "failed"
    job["error"] = f"{name} failed with exit code {result['returncode']}."
    return False


def _skip(job, name, reason):
    _add_stage(
        job,
        name,
        status="skipped",
        logs=reason,
        duration=0,
    )


def _safe_image_name(job_id):
    return "allinone-cicd-" + re.sub(r"[^a-zA-Z0-9_.-]", "", job_id.lower())


def _safe_container_name(job_id):
    return "allinone-app-" + re.sub(r"[^a-zA-Z0-9_.-]", "", job_id.lower())


def _inspect_container(container):
    result = _run(
        ["docker", "inspect", "--format", "{{json .State}}", container],
        timeout=30,
    )
    if result["returncode"] != 0:
        return None, result["output"]

    try:
        return json.loads(result["output"]), ""
    except json.JSONDecodeError:
        return None, "Docker returned invalid inspect data."


def _deploy(job, image, job_id):
    container = _safe_container_name(job_id)
    stage = _add_stage(job, "Deploy")
    started = time.time()

    # Remove a stale container with the same name, if one exists.
    _run(["docker", "rm", "-f", container], timeout=30)

    result = _run(
        [
            "docker", "run", "-d",
            "--name", container,
            "-P",
            image,
        ],
        timeout=120,
    )

    stage["duration"] = round(time.time() - started, 2)
    stage["exit_code"] = result["returncode"]
    stage["finished_at"] = _now()

    if result["returncode"] != 0:
        stage["status"] = "failed"
        stage["logs"] = result["output"]
        job["status"] = "failed"
        job["error"] = "Deploy failed: Docker could not start the container."
        return False

    container_id = (
        result["output"].strip().splitlines()[0]
        if result["output"].strip()
        else ""
    )
    ports = _run(["docker", "port", container], timeout=30)
    port_output = ports["output"].strip()

    url = None
    match = re.search(r"->\s*0\.0\.0\.0:(\d+)", port_output)
    if match:
        url = f"http://localhost:{match.group(1)}"

    stage["status"] = "success"
    stage["logs"] = (
        f"Container started: {container}\n"
        f"Image: {image}\n"
        f"Container ID: {container_id}\n"
        f"Ports:\n{port_output or 'No ports exposed.'}"
    )

    job["deployment"] = {
        "container": container,
        "container_id": container_id,
        "image": image,
        "ports": port_output,
        "url": url,
    }

    return True


def _verify_deployment(job):
    deployment = job.get("deployment")
    if not deployment:
        return True

    stage = _add_stage(job, "Verify")
    started = time.time()

    # Give the container a moment to start or fail.
    time.sleep(2)

    state, error = _inspect_container(deployment["container"])
    stage["duration"] = round(time.time() - started, 2)
    stage["finished_at"] = _now()

    if state is None:
        stage["status"] = "failed"
        stage["logs"] = error or "Could not inspect the deployed container."
        job["status"] = "failed"
        job["error"] = "Verify failed: the deployed container could not be inspected."
        return False

    deployment["state"] = state.get("Status", "")
    deployment["running"] = bool(state.get("Running"))

    if not state.get("Running"):
        logs = _run(
            ["docker", "logs", "--tail", "80", deployment["container"]],
            timeout=30,
        )
        stage["status"] = "failed"
        stage["logs"] = (
            f"Container is not running (state: {state.get('Status', 'unknown')}).\n"
            f"{logs['output']}"
        )
        job["status"] = "failed"
        job["error"] = "Verify failed: the deployed container exited."
        return False

    stage["status"] = "success"
    stage["logs"] = (
        f"Container {deployment['container']} is running.\n"
        f"State: {state.get('Status', 'running')}"
    )
    return True


def _docker_python_stage(job, name, workdir, script, timeout=300, skipped_returncodes=None):
    return _stage(
        job,
        name,
        [
            "docker", "run", "--rm",
            "-v", f"{workdir}:/app",
            "-w", "/app",
            "python:3.12-slim",
            "sh", "-c", script,
        ],
        timeout=timeout,
        skipped_returncodes=skipped_returncodes,
    )


def _detect_and_build(job, workdir):
    package_json = workdir / "package.json"
    requirements = workdir / "requirements.txt"

    if package_json.exists():
        scripts = {}
        try:
            scripts = json.loads(package_json.read_text(encoding="utf-8")).get(
                "scripts", {}
            ) or {}
        except Exception:
            scripts = {}

        if not _stage(
            job,
            "Build",
            ["npm", "install", "--no-audit", "--no-fund"],
            cwd=workdir,
            timeout=300,
        ):
            return

        if "test" in scripts:
            _stage(
                job,
                "Test",
                ["npm", "test"],
                cwd=workdir,
                timeout=300,
            )
        else:
            _skip(job, "Test", "No npm test script is defined in package.json.")
        return

    if requirements.exists():
        if not _docker_python_stage(
            job,
            "Build",
            workdir,
            "pip install -r requirements.txt -q",
            timeout=300,
        ):
            return

        _docker_python_stage(
            job,
            "Test",
            workdir,
            "python -m pytest -q",
            timeout=300,
            skipped_returncodes={5},
        )
        return

    cpp_files = list(workdir.glob("*.cpp"))
    if cpp_files:
        source = cpp_files[0].name
        if not _stage(
            job,
            "Build",
            [
                "docker", "run", "--rm",
                "-v", f"{workdir}:/app",
                "-w", "/app",
                "gcc:14",
                "sh", "-c",
                f"mkdir -p .build && g++ {source} -std=c++17 -o .build/app",
            ],
            timeout=180,
        ):
            return
        _stage(
            job,
            "Test",
            [
                "docker", "run", "--rm",
                "-v", f"{workdir}:/app",
                "-w", "/app",
                "gcc:14",
                "sh", "-c",
                ".build/app",
            ],
            timeout=120,
        )
        return

    c_files = list(workdir.glob("*.c"))
    if c_files:
        source = c_files[0].name
        if not _stage(
            job,
            "Build",
            [
                "docker", "run", "--rm",
                "-v", f"{workdir}:/app",
                "-w", "/app",
                "gcc:14",
                "sh", "-c",
                f"mkdir -p .build && gcc {source} -o .build/app",
            ],
            timeout=180,
        ):
            return
        _stage(
            job,
            "Test",
            [
                "docker", "run", "--rm",
                "-v", f"{workdir}:/app",
                "-w", "/app",
                "gcc:14",
                "sh", "-c",
                ".build/app",
            ],
            timeout=120,
        )
        return

    java_files = list(workdir.glob("*.java"))
    if java_files:
        source = java_files[0]
        classname = source.stem
        if not _stage(
            job,
            "Build",
            [
                "docker", "run", "--rm",
                "-v", f"{workdir}:/app",
                "-w", "/app",
                "eclipse-temurin:21-jdk",
                "sh", "-c",
                f"mkdir -p .build && javac -d .build {source.name}",
            ],
            timeout=180,
        ):
            return
        _stage(
            job,
            "Test",
            [
                "docker", "run", "--rm",
                "-v", f"{workdir}:/app",
                "-w", "/app",
                "eclipse-temurin:21-jdk",
                "java", "-cp", ".build", classname,
            ],
            timeout=120,
        )
        return

    job["notes"].append(
        "No supported Build/Test configuration was detected, so only the "
        "Source Checkout stage ran."
    )


def run_pipeline(repo_url, branch="main", build_docker=True, deploy=True, job_id=None):
    job_id = job_id or uuid.uuid4().hex[:12]
    job = {
        "id": job_id,
        "engine": "builtin",
        "status": "running",
        "repository": repo_url,
        "branch": branch or "main",
        "started_at": _now(),
        "finished_at": None,
        "stages": [],
        "image": None,
        "deployment": None,
        "notes": [],
        "error": "",
    }
    PIPELINE_JOBS[job_id] = job

    workdir = Path(tempfile.mkdtemp(prefix=f"allinone_pipeline_{job_id}_"))
    image = None

    try:
        ok = _stage(
            job,
            "Source Checkout",
            [
                "git", "clone",
                "--depth", "1",
                "--branch", branch or "main",
                repo_url,
                str(workdir),
            ],
            timeout=180,
        )

        if not ok:
            return job

        _detect_and_build(job, workdir)

        if job["status"] == "failed":
            return job

        if build_docker:
            dockerfile = workdir / "Dockerfile"
            if dockerfile.exists():
                image = _safe_image_name(job_id)
                ok = _stage(
                    job,
                    "Docker Image",
                    ["docker", "build", "-t", image, "."],
                    cwd=workdir,
                    timeout=600,
                )
                if ok:
                    job["image"] = image
            else:
                job["notes"].append(
                    "Docker image build skipped: no Dockerfile was found at "
                    "the repository root."
                )
        else:
            job["notes"].append("Docker image build was disabled for this run.")

        if image and deploy:
            if _deploy(job, image, job_id):
                _verify_deployment(job)
        elif deploy:
            job["notes"].append(
                "Deployment skipped because no Docker image was built."
            )

        if job["status"] != "failed":
            job["status"] = "success"

        return job

    except Exception as exc:
        job["status"] = "failed"
        job["error"] = str(exc)
        return job

    finally:
        job["finished_at"] = _now()
        shutil.rmtree(workdir, ignore_errors=True)


def get_job(job_id):
    return PIPELINE_JOBS.get(job_id)
