import json
import re
import shutil
import subprocess

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .auth_utils import authenticate_request
from .history import record_change


IMAGE_PREFIX = "allinone-cicd-"
CONTAINER_PREFIX = "allinone-app-"
NAME_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*$")
IMAGE_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.:/@-]*$")


def _docker(args, timeout=30):
    if shutil.which("docker") is None:
        return {
            "available": False,
            "returncode": 127,
            "output": (
                "Docker was not found. Install Docker Desktop and make sure "
                "it is running."
            ),
        }

    try:
        result = subprocess.run(
            ["docker", *args],
            capture_output=True,
            text=True,
            timeout=timeout,
            encoding="utf-8",
            errors="replace",
        )
        return {
            "available": True,
            "returncode": result.returncode,
            "output": (result.stdout or "") + (result.stderr or ""),
        }
    except subprocess.TimeoutExpired:
        return {
            "available": True,
            "returncode": 124,
            "output": "Docker command timed out.",
        }
    except Exception as exc:
        return {
            "available": True,
            "returncode": 1,
            "output": str(exc),
        }


def _json_lines(output):
    items = []
    for line in output.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            items.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return items


def _error(message, status=400):
    return JsonResponse({"success": False, "error": message}, status=status)


def _auth(request):
    user, error = authenticate_request(request)
    if user is None:
        return None, _error(error or "Authentication required.", status=401)
    return user, None


def _valid_name(value):
    return bool(value and NAME_PATTERN.match(value))


def _can_manage_container(user, name):
    return name.startswith(CONTAINER_PREFIX) or user.is_staff


def _run_action(user, *, action, summary, resource_type, resource_id, command, project=None, metadata=None):
    before = None
    if resource_type == "container":
        before = _inspect_resource("container", resource_id)
    elif resource_type == "image":
        before = _inspect_resource("image", resource_id)

    result = _docker(command)

    after = None
    if result["returncode"] == 0:
        after = _inspect_resource(resource_type, resource_id)

    record_change(
        user=user,
        module="docker",
        action=action,
        summary=summary,
        project=project,
        resource_type=resource_type,
        resource_id=resource_id,
        result="success" if result["returncode"] == 0 else "failed",
        before=before,
        after=after,
        metadata={
            **(metadata or {}),
            "command_result": result["output"][:2000],
        },
        reversible=False,
    )

    if result["returncode"] != 0:
        return _error(result["output"] or "Docker operation failed.", status=400)

    return JsonResponse({
        "success": True,
        "message": summary,
    })


def _inspect_resource(resource_type, name):
    result = _docker(["inspect", name])
    if result["returncode"] != 0:
        return None

    try:
        data = json.loads(result["output"])
    except json.JSONDecodeError:
        return None

    if not isinstance(data, list) or not data:
        return None

    item = data[0]
    if resource_type == "container":
        state = item.get("State", {})
        return {
            "id": item.get("Id", ""),
            "name": item.get("Name", ""),
            "image": item.get("Config", {}).get("Image", ""),
            "status": state.get("Status", ""),
            "running": state.get("Running", False),
            "started_at": state.get("StartedAt", ""),
            "finished_at": state.get("FinishedAt", ""),
        }

    return {
        "id": item.get("Id", ""),
        "tags": item.get("RepoTags") or [],
        "created": item.get("Created", ""),
        "size": item.get("Size", 0),
    }


@csrf_exempt
def docker_status(request):
    if request.method != "GET":
        return _error("GET method required.", status=405)

    _, auth_error = _auth(request)
    if auth_error:
        return auth_error

    result = _docker(["version", "--format", "{{.Server.Version}}"], timeout=15)
    available = result["available"] and result["returncode"] == 0

    return JsonResponse({
        "success": available,
        "available": available,
        "version": result["output"].strip() if available else "",
        "error": "" if available else result["output"],
        "setup": (
            ""
            if available
            else (
                "Install Docker Desktop, start the Docker Engine, and make "
                "sure the docker CLI is on PATH."
            )
        ),
    }, status=200 if available else 503)


@csrf_exempt
def docker_images(request):
    if request.method != "GET":
        return _error("GET method required.", status=405)

    _, auth_error = _auth(request)
    if auth_error:
        return auth_error

    result = _docker([
        "images",
        "--format",
        "{{json .}}",
    ])

    if not result["available"]:
        return JsonResponse({
            "success": False,
            "available": False,
            "error": result["output"],
            "images": [],
        }, status=503)

    if result["returncode"] != 0:
        return JsonResponse({
            "success": False,
            "available": True,
            "error": result["output"],
            "images": [],
        }, status=500)

    images = _json_lines(result["output"])
    for image in images:
        image["managed"] = str(image.get("Repository", "")).startswith(IMAGE_PREFIX)

    return JsonResponse({
        "success": True,
        "available": True,
        "images": images,
    })


@csrf_exempt
def docker_containers(request):
    if request.method != "GET":
        return _error("GET method required.", status=405)

    _, auth_error = _auth(request)
    if auth_error:
        return auth_error

    result = _docker([
        "ps",
        "-a",
        "--format",
        "{{json .}}",
    ])

    if not result["available"]:
        return JsonResponse({
            "success": False,
            "available": False,
            "error": result["output"],
            "containers": [],
        }, status=503)

    if result["returncode"] != 0:
        return JsonResponse({
            "success": False,
            "available": True,
            "error": result["output"],
            "containers": [],
        }, status=500)

    containers = _json_lines(result["output"])
    for container in containers:
        container["managed"] = str(container.get("Names", "")).startswith(
            CONTAINER_PREFIX
        )

    return JsonResponse({
        "success": True,
        "available": True,
        "containers": containers,
    })


@csrf_exempt
def docker_container_inspect(request, name):
    if request.method != "GET":
        return _error("GET method required.", status=405)

    _, auth_error = _auth(request)
    if auth_error:
        return auth_error

    if not _valid_name(name):
        return _error("Invalid container name.", status=400)

    result = _docker(["inspect", name])
    if result["returncode"] != 0:
        return _error(result["output"], status=404)

    try:
        data = json.loads(result["output"])
    except json.JSONDecodeError:
        return _error("Docker returned invalid inspect data.", status=500)

    return JsonResponse({"success": True, "inspect": data})


@csrf_exempt
def docker_container_logs(request, name):
    if request.method != "GET":
        return _error("GET method required.", status=405)

    _, auth_error = _auth(request)
    if auth_error:
        return auth_error

    if not _valid_name(name):
        return _error("Invalid container name.", status=400)

    result = _docker(["logs", "--tail", "200", name])

    if not result["available"]:
        return _error(result["output"], status=503)

    if result["returncode"] != 0:
        return _error(result["output"], status=400)

    return JsonResponse({
        "success": True,
        "container": name,
        "logs": result["output"],
    })


@csrf_exempt
def docker_container_start(request, name):
    if request.method != "POST":
        return _error("POST method required.", status=405)

    user, auth_error = _auth(request)
    if auth_error:
        return auth_error

    if not _valid_name(name):
        return _error("Invalid container name.", status=400)

    if not _can_manage_container(user, name):
        return _error("You do not have permission to manage this container.", status=403)

    return _run_action(
        user,
        action="docker.container.start",
        summary=f"Started container {name}",
        resource_type="container",
        resource_id=name,
        command=["start", name],
        metadata={"recovery": "Stop the container from the Docker page if needed."},
    )


@csrf_exempt
def docker_container_stop(request, name):
    if request.method != "POST":
        return _error("POST method required.", status=405)

    user, auth_error = _auth(request)
    if auth_error:
        return auth_error

    if not _valid_name(name):
        return _error("Invalid container name.", status=400)

    if not _can_manage_container(user, name):
        return _error("You do not have permission to manage this container.", status=403)

    return _run_action(
        user,
        action="docker.container.stop",
        summary=f"Stopped container {name}",
        resource_type="container",
        resource_id=name,
        command=["stop", "-t", "10", name],
        metadata={"recovery": "Start the container again from the Docker page."},
    )


@csrf_exempt
def docker_remove_container(request, name):
    if request.method != "POST":
        return _error("POST method required.", status=405)

    user, auth_error = _auth(request)
    if auth_error:
        return auth_error

    if not _valid_name(name):
        return _error("Invalid container name.", status=400)

    if not _can_manage_container(user, name):
        return _error("You do not have permission to manage this container.", status=403)

    return _run_action(
        user,
        action="docker.container.remove",
        summary=f"Removed container {name}",
        resource_type="container",
        resource_id=name,
        command=["rm", "-f", name],
        metadata={
            "recovery": (
                "A removed container cannot be restored. Rebuild the image "
                "and deploy it again through CI/CD."
            )
        },
    )


@csrf_exempt
def docker_remove_image(request, image):
    if request.method != "POST":
        return _error("POST method required.", status=405)

    user, auth_error = _auth(request)
    if auth_error:
        return auth_error

    if not image or not IMAGE_PATTERN.match(image):
        return _error("Invalid image name.", status=400)

    if not image.startswith(IMAGE_PREFIX) and not user.is_staff:
        return _error("You do not have permission to remove this image.", status=403)

    return _run_action(
        user,
        action="docker.image.remove",
        summary=f"Removed image {image}",
        resource_type="image",
        resource_id=image,
        command=["rmi", "-f", image],
        metadata={
            "recovery": (
                "A removed image cannot be restored. Rebuild it through CI/CD."
            )
        },
    )
