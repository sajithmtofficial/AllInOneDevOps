import json
import re
import threading
import uuid

from django.db.models import Q
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from .auth_utils import authenticate_request
from .history import record_change
from .jenkins_service import (
    default_job,
    is_configured as jenkins_configured,
    status as jenkins_status,
    trigger_build,
    list_builds as jenkins_builds,
)
from .models import Project, WorkflowRun
from .pipeline_service import get_job, run_pipeline
from .project_access import accessible_projects, can_view_project
from .serializers import WorkflowRunSerializer


ACTIVE_WORKFLOWS = {}
ACTIVE_LOCK = threading.Lock()

BRANCH_PATTERN = re.compile(r"^[A-Za-z0-9._/-]+$")


def _auth(request):
    user, error = authenticate_request(request)
    if user is None:
        return None, JsonResponse(
            {"success": False, "error": error or "Authentication required."},
            status=401,
        )
    return user, None


def _as_bool(value, default=True):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in ("1", "true", "yes", "on")


def _reserve(key, run_id):
    with ACTIVE_LOCK:
        if key in ACTIVE_WORKFLOWS:
            return False, ACTIVE_WORKFLOWS[key]
        ACTIVE_WORKFLOWS[key] = run_id
        return True, run_id


def _release(key, run_id):
    with ACTIVE_LOCK:
        if ACTIVE_WORKFLOWS.get(key) == run_id:
            ACTIVE_WORKFLOWS.pop(key, None)


def _active_key(user, project_id, repo_url, branch, engine, job_name=""):
    return (
        user.id,
        project_id or "",
        repo_url,
        branch,
        engine,
        job_name,
    )


def _job_from_run(run):
    deployment = run.deployment or None
    if deployment is None and run.container:
        deployment = {
            "container": run.container,
            "image": run.image,
        }

    return {
        "id": run.external_id,
        "run_id": str(run.id),
        "engine": run.engine,
        "status": run.status,
        "repository": run.repository,
        "branch": run.branch,
        "started_at": run.started_at.isoformat() if run.started_at else None,
        "finished_at": run.finished_at.isoformat() if run.finished_at else None,
        "stages": run.stages or [],
        "image": run.image,
        "deployment": deployment,
        "notes": [],
        "error": run.error,
        "jenkins": {
            "job": run.jenkins_job,
            "build": run.jenkins_build,
            "url": run.jenkins_url,
        } if run.engine == "jenkins" or run.jenkins_job else None,
    }


@csrf_exempt
def pipeline_config(request):
    if request.method != "GET":
        return JsonResponse({"success": False, "error": "GET method required."}, status=405)

    _, auth_error = _auth(request)
    if auth_error:
        return auth_error

    jenkins = jenkins_status()

    return JsonResponse({
        "success": True,
        "engines": {
            "builtin": {
                "available": True,
                "label": "Built-in runner",
                "reason": "",
            },
            "jenkins": {
                "available": bool(jenkins.get("configured") and jenkins.get("reachable")),
                "configured": bool(jenkins.get("configured")),
                "reachable": bool(jenkins.get("reachable")),
                "default_job": jenkins.get("default_job", ""),
                "reason": jenkins.get("error", "") or (
                    "" if jenkins.get("reachable") else "Jenkins is not reachable."
                ),
            },
        },
        "default_engine": "jenkins" if jenkins.get("reachable") else "builtin",
    })


@csrf_exempt
def pipeline_run(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST method required."}, status=405)

    user, auth_error = _auth(request)
    if auth_error:
        return auth_error

    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Invalid JSON."}, status=400)

    if not isinstance(data, dict):
        return JsonResponse({"success": False, "error": "Invalid JSON object."}, status=400)

    project = None
    project_id = data.get("project_id")
    if project_id not in (None, ""):
        try:
            project = accessible_projects(user).filter(pk=int(project_id)).first()
        except (TypeError, ValueError):
            project = None
        if not project:
            return JsonResponse(
                {"success": False, "error": "Project not found."},
                status=400,
            )

    repo_url = str(data.get("repo_url") or "").strip()
    if not repo_url and project:
        repo_url = project.github_url

    branch = str(data.get("branch") or (project.branch if project else "main")).strip() or "main"
    build_docker = _as_bool(data.get("build_docker"), True)
    deploy = _as_bool(data.get("deploy"), True)
    engine = str(data.get("engine") or "auto").strip().lower()
    jenkins_job = str(data.get("jenkins_job") or "").strip()

    if engine not in ("auto", "builtin", "jenkins"):
        return JsonResponse(
            {"success": False, "error": "Engine must be auto, builtin or jenkins."},
            status=400,
        )

    if not repo_url:
        return JsonResponse(
            {"success": False, "error": "Repository URL is required."},
            status=400,
        )

    if not re_match_github(repo_url):
        return JsonResponse(
            {"success": False, "error": "Enter a valid GitHub repository URL."},
            status=400,
        )

    if not BRANCH_PATTERN.match(branch):
        return JsonResponse(
            {"success": False, "error": "Enter a valid Git branch name."},
            status=400,
        )

    if engine == "auto":
        engine = "jenkins" if (jenkins_configured() and user.is_staff) else "builtin"

    if engine == "jenkins" and not user.is_staff:
        return JsonResponse(
            {
                "success": False,
                "error": "Staff permission is required to trigger Jenkins workflows.",
            },
            status=403,
        )

    run_id = uuid.uuid4().hex[:12]

    if engine == "jenkins":
        job_name = jenkins_job or default_job()
        if not job_name:
            return JsonResponse(
                {
                    "success": False,
                    "error": (
                        "Jenkins is the selected engine, but no job name is "
                        "configured. Set JENKINS_JOB or provide jenkins_job."
                    ),
                },
                status=400,
            )

        duplicate = WorkflowRun.objects.filter(
            user=user,
            engine="jenkins",
            jenkins_job=job_name,
            repository=repo_url,
            branch=branch,
            status__in=["queued", "running"],
        ).first()
        if duplicate:
            return JsonResponse(
                {
                    "success": False,
                    "error": "The same Jenkins workflow is already running.",
                    "job": _job_from_run(duplicate),
                },
                status=409,
            )

        run = WorkflowRun.objects.create(
            external_id=run_id,
            project=project,
            user=user,
            username=user.username,
            engine="jenkins",
            repository=repo_url,
            branch=branch,
            status="queued",
            stages=[{
                "name": "Jenkins Build",
                "status": "running",
                "logs": f"Queued Jenkins job {job_name}.",
                "started_at": timezone.now().isoformat(timespec="seconds"),
                "duration": None,
            }],
            jenkins_job=job_name,
        )

        result = trigger_build(job_name)

        if result.get("success"):
            run.status = "queued"
            run.jenkins_url = result.get("queue_url", "")
            run.save(update_fields=["status", "jenkins_url"])

            record_change(
                user=user,
                module="cicd",
                action="workflow.run",
                summary=f"Queued Jenkins workflow {run_id} for {job_name}",
                project=project,
                resource_type="workflow_run",
                resource_id=run_id,
                result="success",
                before=None,
                after={
                    "engine": "jenkins",
                    "repository": repo_url,
                    "branch": branch,
                    "jenkins_job": job_name,
                    "status": "queued",
                },
                metadata={
                    "jenkins_job": job_name,
                    "queue_url": result.get("queue_url", ""),
                    "note": (
                        "Jenkins owns the build execution. Use the Jenkins page "
                        "for live logs and cancellation."
                    ),
                },
                reversible=False,
            )

            return JsonResponse({
                "success": True,
                "job": _job_from_run(run),
                "run": WorkflowRunSerializer(run).data,
            })

        run.status = "failed"
        run.error = result.get("error", "Jenkins rejected the build.")
        run.finished_at = timezone.now()
        run.stages = [{
            "name": "Jenkins Build",
            "status": "failed",
            "logs": run.error,
            "started_at": run.started_at.isoformat(timespec="seconds"),
            "finished_at": timezone.now().isoformat(timespec="seconds"),
            "duration": 0,
        }]
        run.save()

        record_change(
            user=user,
            module="cicd",
            action="workflow.run",
            summary=f"Failed to queue Jenkins workflow {run_id} for {job_name}",
            project=project,
            resource_type="workflow_run",
            resource_id=run_id,
            result="failed",
            before=None,
            after={"engine": "jenkins", "status": "failed", "error": run.error},
            metadata={"jenkins_job": job_name},
            reversible=False,
        )

        return JsonResponse(
            {
                "success": False,
                "error": run.error,
                "job": _job_from_run(run),
                "run": WorkflowRunSerializer(run).data,
            },
            status=400,
        )

    key = _active_key(user, project.id if project else None, repo_url, branch, "builtin")
    reserved, existing_id = _reserve(key, run_id)
    if not reserved:
        existing = WorkflowRun.objects.filter(external_id=existing_id).first()
        return JsonResponse(
            {
                "success": False,
                "error": "The same CI/CD workflow is already running.",
                "job": _job_from_run(existing) if existing else None,
            },
            status=409,
        )

    run = WorkflowRun.objects.create(
        external_id=run_id,
        project=project,
        user=user,
        username=user.username,
        engine="builtin",
        repository=repo_url,
        branch=branch,
        status="running",
        stages=[],
    )

    try:
        job = run_pipeline(
            repo_url,
            branch,
            build_docker,
            deploy,
            job_id=run_id,
        )

        run.status = job["status"]
        run.stages = job.get("stages", [])
        run.image = job.get("image") or ""
        deployment = job.get("deployment") or {}
        run.container = deployment.get("container", "")
        run.deployment = deployment
        run.error = job.get("error", "")
        run.finished_at = timezone.now()
        run.save()

        record_change(
            user=user,
            module="cicd",
            action="workflow.run",
            summary=(
                f"CI/CD workflow {run_id} finished with status {job['status']}"
            ),
            project=project,
            resource_type="workflow_run",
            resource_id=run_id,
            result="success" if job["status"] == "success" else "failed",
            before=None,
            after={
                "engine": "builtin",
                "repository": repo_url,
                "branch": branch,
                "status": job["status"],
                "image": job.get("image"),
                "container": deployment.get("container"),
                "deployment_url": deployment.get("url"),
            },
            metadata={
                "job_id": run_id,
                "stage_summary": [
                    {
                        "name": stage.get("name"),
                        "status": stage.get("status"),
                        "duration": stage.get("duration"),
                    }
                    for stage in job.get("stages", [])
                ],
                "note": (
                    "A completed deployment cannot be undone from history. "
                    "Use the Docker page to stop or remove the container, or "
                    "re-run the workflow after correcting the problem."
                ),
            },
            reversible=False,
        )

        return JsonResponse({
            "success": job["status"] == "success",
            "job": job,
            "run": WorkflowRunSerializer(run).data,
        }, status=200 if job["status"] == "success" else 400)

    finally:
        _release(key, run_id)


@csrf_exempt
def pipeline_status(request, job_id):
    if request.method != "GET":
        return JsonResponse({"success": False, "error": "GET method required."}, status=405)

    user, auth_error = _auth(request)
    if auth_error:
        return auth_error

    run = WorkflowRun.objects.select_related("project").filter(
        external_id=job_id
    ).first()
    if not run:
        job = get_job(job_id)
        if job and user.is_staff:
            return JsonResponse({"success": True, "job": job})
        return JsonResponse(
            {"success": False, "error": "Pipeline job not found."},
            status=404,
        )

    if not (
        user.is_staff
        or run.user_id == user.id
        or (run.project_id and can_view_project(user, run.project))
    ):
        return JsonResponse(
            {"success": False, "error": "You are not allowed to view this workflow run."},
            status=403,
        )

    job = get_job(job_id)
    if job:
        return JsonResponse({"success": True, "job": job})

    if run.engine == "jenkins" and run.status in ("queued", "running"):
        builds = jenkins_builds(run.jenkins_job)
        if not builds.get("error") and builds.get("builds"):
            latest = builds["builds"][0]
            if latest.get("number") and latest.get("result"):
                run.jenkins_build = latest["number"]
                run.jenkins_url = latest.get("url", run.jenkins_url)
                run.status = "success" if latest.get("result") == "SUCCESS" else "failed"
                run.finished_at = timezone.now()
                run.stages = [{
                    "name": "Jenkins Build",
                    "status": run.status,
                    "logs": (
                        f"Jenkins build #{latest['number']} finished with "
                        f"result {latest.get('result')}.\n"
                        f"{latest.get('url', '')}"
                    ),
                    "started_at": run.started_at.isoformat(timespec="seconds"),
                    "finished_at": run.finished_at.isoformat(timespec="seconds"),
                    "duration": round((latest.get("duration") or 0) / 1000, 2),
                }]
                run.save()

    return JsonResponse({
        "success": True,
        "job": _job_from_run(run),
        "run": WorkflowRunSerializer(run).data,
    })


@csrf_exempt
def pipeline_runs(request):
    if request.method != "GET":
        return JsonResponse({"success": False, "error": "GET method required."}, status=405)

    user, auth_error = _auth(request)
    if auth_error:
        return auth_error

    runs = WorkflowRun.objects.select_related("project")
    if not user.is_staff:
        visible_projects = accessible_projects(user).values("pk")
        runs = runs.filter(
            Q(user=user) | Q(project_id__in=visible_projects)
        ).distinct()

    runs = runs.all()

    project_id = request.GET.get("project")
    status = request.GET.get("status")
    engine = request.GET.get("engine")

    if project_id:
        runs = runs.filter(project_id=project_id)
    if status:
        runs = runs.filter(status=status)
    if engine:
        runs = runs.filter(engine=engine)

    try:
        limit = max(1, min(int(request.GET.get("limit", "20")), 100))
    except (TypeError, ValueError):
        limit = 20

    return JsonResponse({
        "success": True,
        "runs": WorkflowRunSerializer(runs[:limit], many=True).data,
    })


def re_match_github(url):
    return (
        url.startswith("https://github.com/")
        or url.startswith("http://github.com/")
        or url.startswith("git@github.com:")
    )
