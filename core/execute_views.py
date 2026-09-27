import json
import os
import shutil
import subprocess
import tempfile
import threading
import uuid

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


# ============================================================
# CONFIGURATION
# ============================================================

# Maximum execution time for one program.
DOCKER_TIMEOUT = 60

# Currently running Docker container.
# This simple approach is suitable for a local/MCA project.
# A production system should use a proper job queue/runner service.
ACTIVE_CONTAINER_NAME = None
ACTIVE_CONTAINER_LOCK = threading.Lock()


# ============================================================
# LANGUAGE CONFIGURATION
# ============================================================

LANGUAGE_CONFIG = {
    # --------------------------------------------------------
    # Python
    # --------------------------------------------------------
    "python": {
        "image": "python:3.12-slim",
        "filename": "main.py",
        "command": [
            "python",
            "/code/main.py",
        ],
    },

    # --------------------------------------------------------
    # JavaScript
    # --------------------------------------------------------
    "javascript": {
        "image": "node:22-alpine",
        "filename": "main.js",
        "command": [
            "node",
            "/code/main.js",
        ],
    },

    # --------------------------------------------------------
    # Java
    # --------------------------------------------------------
    "java": {
        "image": "eclipse-temurin:21-jdk",
        "filename": "Main.java",
        "command": [
            "sh",
            "-c",
            "mkdir -p /tmp/classes && "
            "javac -d /tmp/classes /code/Main.java && "
            "java -cp /tmp/classes Main",
        ],
    },

    # --------------------------------------------------------
    # C
    # --------------------------------------------------------
    "c": {
        "image": "gcc:14",
        "filename": "main.c",
        "command": [
            "sh",
            "-c",
            "gcc /code/main.c -o /tmp/main && "
            "chmod +x /tmp/main && "
            "/tmp/main",
        ],
    },

    # --------------------------------------------------------
    # C++
    # --------------------------------------------------------
    "cpp": {
        "image": "gcc:14",
        "filename": "main.cpp",
        "command": [
            "sh",
            "-c",
            "g++ /code/main.cpp -o /tmp/main && "
            "chmod +x /tmp/main && "
            "/tmp/main",
        ],
    },
}


# ============================================================
# ACTIVE CONTAINER HELPERS
# ============================================================

def _set_active_container(name):
    global ACTIVE_CONTAINER_NAME

    with ACTIVE_CONTAINER_LOCK:
        ACTIVE_CONTAINER_NAME = name


def _clear_active_container(name):
    global ACTIVE_CONTAINER_NAME

    with ACTIVE_CONTAINER_LOCK:
        if ACTIVE_CONTAINER_NAME == name:
            ACTIVE_CONTAINER_NAME = None


def _get_active_container():
    with ACTIVE_CONTAINER_LOCK:
        return ACTIVE_CONTAINER_NAME


# ============================================================
# DOCKER EXECUTION
# ============================================================

def run_in_docker(code, language, stdin=""):
    """
    Write the user's source code into a temporary directory
    and execute it inside an isolated Docker container.
    """

    config = LANGUAGE_CONFIG.get(language)

    if not config:
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Language '{language}' is not supported.",
            "returncode": 400,
        }

    # --------------------------------------------------------
    # Create temporary working directory
    # --------------------------------------------------------

    workdir = tempfile.mkdtemp(
        prefix="allinone_runner_"
    )

    container_name = (
        f"allinone-runner-{uuid.uuid4().hex[:12]}"
    )

    try:

        # ----------------------------------------------------
        # Create source file
        # ----------------------------------------------------

        source_path = os.path.join(
            workdir,
            config["filename"]
        )

        with open(
            source_path,
            "w",
            encoding="utf-8",
            newline=""
        ) as source_file:

            source_file.write(code)

        # ----------------------------------------------------
        # Docker command
        # ----------------------------------------------------

        command = [
            "docker",
            "run",

            "--rm",

            "--name",
            container_name,

            # ------------------------------------------------
            # Security
            # ------------------------------------------------

            # No internet access.
            "--network",
            "none",

            # ------------------------------------------------
            # Resource limits
            # ------------------------------------------------

            "--memory",
            "256m",

            "--cpus",
            "1.0",

            "--pids-limit",
            "64",

            # ------------------------------------------------
            # Remove Linux capabilities.
            # ------------------------------------------------

            "--cap-drop",
            "ALL",

            # ------------------------------------------------
            # Prevent privilege escalation.
            # ------------------------------------------------

            "--security-opt",
            "no-new-privileges",

            # ------------------------------------------------
            # Writable temporary directory.
            #
            # IMPORTANT:
            # exec is explicitly enabled so compiled C/C++
            # binaries can execute from /tmp.
            # ------------------------------------------------

            "--tmpfs",
            "/tmp:rw,nosuid,nodev,exec,size=64m",

            # ------------------------------------------------
            # Source code is read-only.
            # ------------------------------------------------

            "-v",
            f"{workdir}:/code:ro",

            # ------------------------------------------------
            # Working directory.
            # ------------------------------------------------

            "-w",
            "/code",

            # ------------------------------------------------
            # Docker image.
            # ------------------------------------------------

            config["image"],

            # ------------------------------------------------
            # Language command.
            # ------------------------------------------------

            *config["command"],
        ]

        # Mark this container as active.
        _set_active_container(container_name)

        try:

            process = subprocess.run(
                command,
                input=stdin or "",
                text=True,
                capture_output=True,
                timeout=DOCKER_TIMEOUT,
                encoding="utf-8",
                errors="replace",
            )

        except subprocess.TimeoutExpired as exc:

            # ------------------------------------------------
            # subprocess timeout kills the Docker CLI,
            # so explicitly stop the container too.
            # ------------------------------------------------

            try:

                subprocess.run(
                    [
                        "docker",
                        "stop",
                        "-t",
                        "1",
                        container_name,
                    ],
                    capture_output=True,
                    text=True,
                    timeout=5,
                )

            except Exception:
                pass

            stdout = exc.stdout or ""
            stderr = exc.stderr or ""

            return {
                "success": False,
                "stdout": stdout,
                "stderr": (
                    stderr
                    + ("\n" if stderr else "")
                    + "Execution timed out after "
                    f"{DOCKER_TIMEOUT} seconds."
                ),
                "returncode": 124,
            }

        # ----------------------------------------------------
        # Normal execution result
        # ----------------------------------------------------

        return {
            "success": process.returncode == 0,
            "stdout": process.stdout or "",
            "stderr": process.stderr or "",
            "returncode": process.returncode,
        }

    # ========================================================
    # DOCKER NOT FOUND
    # ========================================================

    except FileNotFoundError:

        return {
            "success": False,
            "stdout": "",
            "stderr": (
                "Docker was not found.\n\n"
                "Install Docker Desktop on the "
                "server/development machine and make "
                "sure Docker is running."
            ),
            "returncode": 127,
        }

    # ========================================================
    # DOCKER OPERATION TIMEOUT
    # ========================================================

    except subprocess.TimeoutExpired:

        return {
            "success": False,
            "stdout": "",
            "stderr": (
                "Docker operation timed out."
            ),
            "returncode": 124,
        }

    # ========================================================
    # OTHER ERRORS
    # ========================================================

    except Exception as exc:

        return {
            "success": False,
            "stdout": "",
            "stderr": str(exc),
            "returncode": 1,
        }

    finally:

        # ----------------------------------------------------
        # Clear active container.
        # ----------------------------------------------------

        _clear_active_container(
            container_name
        )

        # ----------------------------------------------------
        # Delete temporary source directory.
        # ----------------------------------------------------

        shutil.rmtree(
            workdir,
            ignore_errors=True
        )


# ============================================================
# EXECUTE CODE API
# ============================================================

@csrf_exempt
def execute_code(request):
    """
    API endpoint:

        POST /api/execute/

    Expected JSON:

        {
            "language": "python",
            "code": "print('Hello')",
            "stdin": ""
        }
    """

    # --------------------------------------------------------
    # Only POST is allowed.
    # --------------------------------------------------------

    if request.method != "POST":

        return JsonResponse(
            {
                "success": False,
                "error": (
                    "Only POST requests are allowed."
                ),
            },
            status=405,
        )

    # --------------------------------------------------------
    # Parse JSON
    # --------------------------------------------------------

    try:

        payload = json.loads(
            request.body.decode("utf-8")
        )

    except (
        json.JSONDecodeError,
        UnicodeDecodeError
    ):

        return JsonResponse(
            {
                "success": False,
                "error": "Invalid JSON request.",
            },
            status=400,
        )

    # --------------------------------------------------------
    # Get request values
    # --------------------------------------------------------

    language = str(
        payload.get("language", "")
    ).strip().lower()

    code = payload.get(
        "code",
        ""
    )

    stdin = payload.get(
        "stdin",
        ""
    )

    # --------------------------------------------------------
    # Validate code
    # --------------------------------------------------------

    if not isinstance(code, str):

        return JsonResponse(
            {
                "success": False,
                "error": "Code must be a string.",
            },
            status=400,
        )

    if not isinstance(stdin, str):

        stdin = str(stdin)

    if not code.strip():

        return JsonResponse(
            {
                "success": False,
                "error": "Code cannot be empty.",
            },
            status=400,
        )

    # --------------------------------------------------------
    # Maximum source-code size
    # --------------------------------------------------------

    max_code_size = 512 * 1024

    if len(code.encode("utf-8")) > max_code_size:

        return JsonResponse(
            {
                "success": False,
                "error": (
                    "Code is too large. "
                    "Maximum size is 512 KB."
                ),
            },
            status=413,
        )

    # --------------------------------------------------------
    # Validate language
    # --------------------------------------------------------

    if language not in LANGUAGE_CONFIG:

        return JsonResponse(
            {
                "success": False,
                "error": (
                    f"Unsupported language: {language}. "
                    "Supported languages are "
                    "Python, JavaScript, Java, C and C++."
                ),
            },
            status=400,
        )

    # --------------------------------------------------------
    # Execute
    # --------------------------------------------------------

    result = run_in_docker(
        code,
        language,
        stdin
    )

    # --------------------------------------------------------
    # Return result
    # --------------------------------------------------------

    return JsonResponse(
        {
            "success": result["success"],
            "language": language,
            "stdout": result["stdout"],
            "stderr": result["stderr"],
            "returncode": result["returncode"],
        },
        status=200 if result["success"] else 400,
    )


# ============================================================
# STOP CODE API
# ============================================================

@csrf_exempt
def stop_code(request):
    """
    Stop the currently running Docker execution.
    """

    # --------------------------------------------------------
    # Only POST is allowed.
    # --------------------------------------------------------

    if request.method != "POST":

        return JsonResponse(
            {
                "success": False,
                "error": (
                    "Only POST requests are allowed."
                ),
            },
            status=405,
        )

    # --------------------------------------------------------
    # Get active container
    # --------------------------------------------------------

    container_name = _get_active_container()

    if not container_name:

        return JsonResponse(
            {
                "success": True,
                "message": (
                    "No running execution found."
                ),
            }
        )

    try:

        # ----------------------------------------------------
        # Stop Docker container
        # ----------------------------------------------------

        result = subprocess.run(
            [
                "docker",
                "stop",
                "-t",
                "1",
                container_name,
            ],
            capture_output=True,
            text=True,
            timeout=5,
        )

        _clear_active_container(
            container_name
        )

        # ----------------------------------------------------
        # Successfully stopped
        # ----------------------------------------------------

        if result.returncode == 0:

            return JsonResponse(
                {
                    "success": True,
                    "message": "Execution stopped.",
                }
            )

        # ----------------------------------------------------
        # Stop failed
        # ----------------------------------------------------

        return JsonResponse(
            {
                "success": False,
                "error": (
                    result.stderr.strip()
                    or "Unable to stop the container."
                ),
            },
            status=400,
        )

    # ========================================================
    # DOCKER NOT FOUND
    # ========================================================

    except FileNotFoundError:

        return JsonResponse(
            {
                "success": False,
                "error": (
                    "Docker Desktop is not installed "
                    "or Docker is not available in PATH."
                ),
            },
            status=500,
        )

    # ========================================================
    # OTHER ERRORS
    # ========================================================

    except Exception as exc:

        return JsonResponse(
            {
                "success": False,
                "error": str(exc),
            },
            status=500,
        )