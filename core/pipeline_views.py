import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .pipeline_service import get_job, run_pipeline


@csrf_exempt
def pipeline_run(request):
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "error": "POST method required."},
            status=405,
        )

    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse(
            {"success": False, "error": "Invalid JSON."},
            status=400,
        )

    repo_url = str(data.get("repo_url", "")).strip()
    branch = str(data.get("branch", "main")).strip() or "main"
    build_docker = bool(data.get("build_docker", True))

    if not repo_url:
        return JsonResponse(
            {"success": False, "error": "Repository URL is required."},
            status=400,
        )

    if not re_match_github(repo_url):
        return JsonResponse(
            {"success": False, "error": "Enter a valid Git repository URL."},
            status=400,
        )

    job = run_pipeline(repo_url, branch, build_docker)

    return JsonResponse({
        "success": job["status"] == "success",
        "job": job,
    }, status=200 if job["status"] == "success" else 400)


def re_match_github(url):
    return (
        url.startswith("https://github.com/")
        or url.startswith("http://github.com/")
        or url.startswith("git@github.com:")
    )


def pipeline_status(request, job_id):
    if request.method != "GET":
        return JsonResponse(
            {"success": False, "error": "GET method required."},
            status=405,
        )

    job = get_job(job_id)
    if not job:
        return JsonResponse(
            {"success": False, "error": "Pipeline job not found."},
            status=404,
        )

    return JsonResponse({
        "success": True,
        "job": job,
    })
