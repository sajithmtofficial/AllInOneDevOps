from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .auth_utils import authenticate_request
from .history import record_change
from . import jenkins_service


def _auth(request):
    user, error = authenticate_request(request)
    if user is None:
        return None, JsonResponse(
            {"success": False, "error": error or "Authentication required."},
            status=401,
        )
    return user, None


@csrf_exempt
def jenkins_status(request):
    if request.method != "GET":
        return JsonResponse({"success": False, "error": "GET method required."}, status=405)

    _, auth_error = _auth(request)
    if auth_error:
        return auth_error

    data = jenkins_service.status()
    return JsonResponse({"success": True, **data})


@csrf_exempt
def jenkins_jobs(request):
    if request.method != "GET":
        return JsonResponse({"success": False, "error": "GET method required."}, status=405)

    _, auth_error = _auth(request)
    if auth_error:
        return auth_error

    data = jenkins_service.list_jobs()
    status = 200 if (not data["configured"] or not data["error"]) else 503
    return JsonResponse({"success": not bool(data["error"]), **data}, status=status)


@csrf_exempt
def jenkins_builds(request, job_name):
    if request.method != "GET":
        return JsonResponse({"success": False, "error": "GET method required."}, status=405)

    _, auth_error = _auth(request)
    if auth_error:
        return auth_error

    data = jenkins_service.list_builds(job_name)
    status = 200 if not data["error"] else 400
    return JsonResponse({"success": not bool(data["error"]), **data}, status=status)


@csrf_exempt
def jenkins_build_detail(request, job_name, build_number):
    if request.method != "GET":
        return JsonResponse({"success": False, "error": "GET method required."}, status=405)

    _, auth_error = _auth(request)
    if auth_error:
        return auth_error

    data = jenkins_service.get_build(job_name, build_number)
    status = 200 if not data["error"] else 404
    return JsonResponse({"success": not bool(data["error"]), **data}, status=status)


@csrf_exempt
def jenkins_build_console(request, job_name, build_number):
    if request.method != "GET":
        return JsonResponse({"success": False, "error": "GET method required."}, status=405)

    _, auth_error = _auth(request)
    if auth_error:
        return auth_error

    data = jenkins_service.get_console(job_name, build_number)
    status = 200 if not data["error"] else 404
    return JsonResponse({"success": not bool(data["error"]), **data}, status=status)


@csrf_exempt
def jenkins_trigger_build(request, job_name):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST method required."}, status=405)

    user, auth_error = _auth(request)
    if auth_error:
        return auth_error

    if not user.is_staff:
        record_change(
            user=user,
            module="jenkins",
            action="jenkins.build.trigger",
            summary=f"Denied Jenkins build trigger for {job_name}",
            resource_type="jenkins_job",
            resource_id=job_name,
            result="failed",
            metadata={"reason": "Staff permission required."},
            reversible=False,
        )
        return JsonResponse(
            {
                "success": False,
                "error": "Staff permission is required to trigger Jenkins builds.",
            },
            status=403,
        )

    result = jenkins_service.trigger_build(job_name)

    record_change(
        user=user,
        module="jenkins",
        action="jenkins.build.trigger",
        summary=(
            f"Triggered Jenkins job {job_name}"
            if result.get("success")
            else f"Failed to trigger Jenkins job {job_name}"
        ),
        resource_type="jenkins_job",
        resource_id=job_name,
        result="success" if result.get("success") else "failed",
        metadata={
            "queue_url": result.get("queue_url", ""),
            "error": result.get("error", ""),
            "note": "Use Jenkins for build logs and cancellation.",
        },
        reversible=False,
    )

    return JsonResponse(
        result,
        status=200 if result.get("success") else 400,
    )
