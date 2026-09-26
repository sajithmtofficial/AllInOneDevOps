"""
Multi-language code execution endpoint.

Supported:
    Python
    JavaScript / Node.js
    Java
    C
    C++

HTML and CSS are handled as preview languages by the frontend.

IMPORTANT:
This endpoint executes user-provided code directly on the local machine.
It is suitable for local development only.

Before deploying publicly, execute code inside isolated Docker containers.
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST


TIMEOUT_SECONDS = 10


# ---------------------------------------------------------
# COMMAND RUNNER
# ---------------------------------------------------------

def run_process(command, workdir, stdin_data=""):
    """
    Run a process safely with a timeout.
    """

    try:
        result = subprocess.run(
            command,
            cwd=workdir,
            input=stdin_data,
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SECONDS,
        )

        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
        }

    except subprocess.TimeoutExpired:
        return {
            "stdout": "",
            "stderr": (
                f"Execution timed out after "
                f"{TIMEOUT_SECONDS} seconds."
            ),
            "returncode": 408,
        }

    except FileNotFoundError:
        return {
            "stdout": "",
            "stderr": (
                f"Required program '{command[0]}' "
                "is not installed or is not available in PATH."
            ),
            "returncode": 500,
        }

    except Exception as error:
        return {
            "stdout": "",
            "stderr": str(error),
            "returncode": 500,
        }


# ---------------------------------------------------------
# PYTHON
# ---------------------------------------------------------

def run_python(code, workdir, stdin_data):
    path = os.path.join(workdir, "main.py")

    with open(path, "w", encoding="utf-8") as file:
        file.write(code)

    # Windows-friendly:
    # use the same Python executable running Django.
    command = [sys.executable, path]

    return run_process(
        command,
        workdir,
        stdin_data,
    )


# ---------------------------------------------------------
# JAVASCRIPT
# ---------------------------------------------------------

def run_javascript(code, workdir, stdin_data):
    path = os.path.join(workdir, "main.js")

    with open(path, "w", encoding="utf-8") as file:
        file.write(code)

    command = ["node", path]

    return run_process(
        command,
        workdir,
        stdin_data,
    )


# ---------------------------------------------------------
# JAVA
# ---------------------------------------------------------

def run_java(code, workdir, stdin_data):
    source_path = os.path.join(workdir, "Main.java")

    with open(source_path, "w", encoding="utf-8") as file:
        file.write(code)

    # Compile
    compile_result = run_process(
        ["javac", "Main.java"],
        workdir,
    )

    if compile_result["returncode"] != 0:
        compile_result["stage"] = "compile"
        return compile_result

    # Run
    run_result = run_process(
        ["java", "-cp", workdir, "Main"],
        workdir,
        stdin_data,
    )

    run_result["stage"] = "run"

    return run_result


# ---------------------------------------------------------
# C
# ---------------------------------------------------------

def run_c(code, workdir, stdin_data):
    source_path = os.path.join(workdir, "main.c")
    executable = os.path.join(workdir, "main.exe")

    with open(source_path, "w", encoding="utf-8") as file:
        file.write(code)

    # Compile
    compile_result = run_process(
        [
            "gcc",
            source_path,
            "-o",
            executable,
        ],
        workdir,
    )

    if compile_result["returncode"] != 0:
        compile_result["stage"] = "compile"
        return compile_result

    # Run
    run_result = run_process(
        [executable],
        workdir,
        stdin_data,
    )

    run_result["stage"] = "run"

    return run_result


# ---------------------------------------------------------
# C++
# ---------------------------------------------------------

def run_cpp(code, workdir, stdin_data):
    source_path = os.path.join(workdir, "main.cpp")
    executable = os.path.join(workdir, "main.exe")

    with open(source_path, "w", encoding="utf-8") as file:
        file.write(code)

    # Compile
    compile_result = run_process(
        [
            "g++",
            source_path,
            "-o",
            executable,
        ],
        workdir,
    )

    if compile_result["returncode"] != 0:
        compile_result["stage"] = "compile"
        return compile_result

    # Run
    run_result = run_process(
        [executable],
        workdir,
        stdin_data,
    )

    run_result["stage"] = "run"

    return run_result


# ---------------------------------------------------------
# LANGUAGE MAP
# ---------------------------------------------------------

RUNNERS = {
    "python": run_python,
    "javascript": run_javascript,
    "java": run_java,
    "c": run_c,
    "cpp": run_cpp,
}


# ---------------------------------------------------------
# API ENDPOINT
# ---------------------------------------------------------

@csrf_exempt
@require_POST
def run_code(request):

    try:
        data = json.loads(
            request.body.decode("utf-8")
        )

    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {
                "error": "Invalid JSON request."
            },
            status=400,
        )

    language = data.get("language")
    code = data.get("code", "")
    stdin_data = data.get("stdin", "")

    if not language:
        return JsonResponse(
            {
                "error": "Language is required."
            },
            status=400,
        )

    if not code.strip():
        return JsonResponse(
            {
                "error": "Code is empty."
            },
            status=400,
        )

    runner = RUNNERS.get(language)

    if runner is None:
        return JsonResponse(
            {
                "error": (
                    f"Unsupported language: {language}. "
                    f"Supported languages: "
                    f"{', '.join(RUNNERS.keys())}"
                )
            },
            status=400,
        )

    workdir = tempfile.mkdtemp(
        prefix="devops_run_"
    )

    try:

        result = runner(
            code,
            workdir,
            stdin_data,
        )

        return JsonResponse(
            {
                "success": result["returncode"] == 0,
                "stdout": result.get("stdout", ""),
                "stderr": result.get("stderr", ""),
                "returncode": result["returncode"],
                "stage": result.get("stage", "run"),
                "language": language,
            }
        )

    except Exception as error:

        return JsonResponse(
            {
                "success": False,
                "stdout": "",
                "stderr": str(error),
                "returncode": 500,
                "language": language,
            },
            status=500,
        )

    finally:
        shutil.rmtree(
            workdir,
            ignore_errors=True,
        )