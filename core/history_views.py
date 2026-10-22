import json

from django.contrib.auth.models import User
from django.db.models import Max, Q
from django.http import JsonResponse
from django.utils.dateparse import parse_date
from django.views.decorators.csrf import csrf_exempt

from .auth_utils import authenticate_request
from .history import project_snapshot, record_change
from .models import ChangeHistory, Project
from .project_access import (
    auditable_projects,
    can_audit_project,
    can_manage_project,
    can_view_project,
)
from .serializers import ChangeHistorySerializer, ProjectSerializer

DEFAULT_LIMIT = 100
MAX_LIMIT = 500


def _auth(request):
    user, error = authenticate_request(request)
    if user is None:
        return None, JsonResponse(
            {"success": False, "error": error or "Authentication required."},
            status=401,
        )
    return user, None


def _can_view_entry(user, entry):
    if user.is_staff or entry.user_id == user.id:
        return True
    if not entry.project_id:
        return False
    return can_audit_project(user, entry.project)


def _can_restore_entry(user, entry):
    if user.is_staff or entry.user_id == user.id:
        return True
    if not entry.project_id:
        return False
    return can_manage_project(user, entry.project)


def _int_param(value, default, minimum, maximum):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default

    return max(minimum, min(parsed, maximum))


def _visible_entries(user, project=None):
    entries = ChangeHistory.objects.select_related("project", "user")

    if project is not None:
        if user.is_staff or can_audit_project(user, project):
            return entries.filter(project=project)
        return entries.filter(project=project, user=user)

    if user.is_staff:
        return entries

    auditable = auditable_projects(user).values("pk")
    return entries.filter(
        Q(user=user) | Q(project_id__in=auditable)
    ).distinct()


def _apply_filters(entries, params):
    username = (params.get("user") or params.get("actor") or "").strip()
    project_id = (params.get("project") or "").strip()
    module = (params.get("module") or "").strip()
    result = (params.get("status") or "").strip()
    action = (params.get("action") or "").strip()
    search = (params.get("q") or "").strip()
    file_path = (params.get("file") or params.get("path") or "").strip()
    date_from = (params.get("date_from") or "").strip()
    date_to = (params.get("date_to") or "").strip()

    if username:
        entries = entries.filter(username__icontains=username)
    if project_id:
        entries = entries.filter(project_id=project_id)
    if module:
        entries = entries.filter(module=module)
    if result:
        entries = entries.filter(result=result)
    if action:
        entries = entries.filter(action__icontains=action)
    if file_path:
        entries = entries.filter(
            Q(resource_id__icontains=file_path)
            | Q(metadata__previous_name__icontains=file_path)
        )
    if search:
        entries = entries.filter(
            Q(summary__icontains=search)
            | Q(username__icontains=search)
            | Q(action__icontains=search)
            | Q(project__name__icontains=search)
        )
    if date_from:
        parsed = parse_date(date_from)
        if not parsed:
            return None, "Invalid date_from. Use YYYY-MM-DD."
        entries = entries.filter(created_at__date__gte=parsed)
    if date_to:
        parsed = parse_date(date_to)
        if not parsed:
            return None, "Invalid date_to. Use YYYY-MM-DD."
        entries = entries.filter(created_at__date__lte=parsed)

    return entries, None


def _paginate(entries, params):
    total = entries.count()
    limit = _int_param(params.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT)
    offset = _int_param(params.get("offset"), 0, 0, 10**9)
    page = list(entries[offset:offset + limit])
    loaded = offset + len(page)

    return page, {
        "total": total,
        "offset": offset,
        "limit": limit,
        "count": len(page),
        "has_more": loaded < total,
        "next_offset": loaded if loaded < total else None,
    }


def _activity_stats(entries):
    last_change = entries.aggregate(last_change=Max("created_at"))["last_change"]

    return {
        "total": entries.count(),
        "contributors": entries.values("username").distinct().count(),
        "files": (
            entries.filter(resource_type="project_file")
            .exclude(resource_id="")
            .values("resource_id")
            .distinct()
            .count()
        ),
        "last_change": last_change.isoformat() if last_change else None,
    }


def _page_response(entries, params, stats_fn=None, **extra):
    entries, error = _apply_filters(entries, params)
    if error:
        return JsonResponse({"success": False, "error": error}, status=400)

    page, pagination = _paginate(entries.order_by("-created_at", "-id"), params)

    payload = {
        "success": True,
        **extra,
        **pagination,
        "history": ChangeHistorySerializer(page, many=True).data,
    }

    if stats_fn:
        payload["stats"] = stats_fn(entries)

    return JsonResponse(payload)


FILE_ACTIVITY_VERBS = {
    "project.file.create": "created",
    "project.file.update": "updated",
    "project.file.rename": "renamed",
    "project.file.delete": "deleted",
}

RECENT_ACTIVITY_LABELS = {
    "project.create": "Project created",
    "project.update": "Project updated",
    "project.delete": "Project deleted",
    "project.restore": "Project restored",
    "project.join": "Collaborator joined",
    "project.leave": "Collaborator left",
    "project.member.remove": "Collaborator removed",
    "project.share.create": "Share link created",
    "project.share.rotate": "Share link regenerated",
    "project.share.revoke": "Share link revoked",
}

MODULE_ICONS = {
    "projects": "folder",
    "docker": "container",
    "jenkins": "server",
    "cicd": "lineChart",
}


def _file_activity_item(entries):
    newest = entries[0]
    project_name = newest.project.name if newest.project_id else "Workspace"
    names = []

    for entry in entries:
        name = (entry.metadata or {}).get("file_name") or entry.resource_id
        if name and name not in names:
            names.append(name)

    if len(entries) == 1:
        verb = FILE_ACTIVITY_VERBS.get(newest.action, "changed")
        title = f"{newest.username} {verb} {names[0] if names else 'a file'}"
    elif len(names) == 1:
        title = f"{newest.username} changed {names[0]} {len(entries)} times"
    else:
        title = f"{newest.username} changed {len(names)} files"

    subtitle = project_name

    if len(names) > 1:
        preview = ", ".join(names[:2])
        if len(names) > 2:
            preview += f" +{len(names) - 2} more"
        subtitle = f"{project_name} — {preview}"

    actions = {entry.action for entry in entries}

    if actions == {"project.file.delete"}:
        tone = "red"
    elif actions <= {"project.file.create"}:
        tone = "green"
    else:
        tone = "blue"

    return {
        "id": f"files-{newest.id}",
        "title": title,
        "subtitle": subtitle,
        "created_at": newest.created_at.isoformat(),
        "icon": "fileText",
        "tone": tone,
        "username": newest.username,
        "project_name": project_name,
        "count": len(entries),
    }


def _entry_activity_item(entry):
    label = RECENT_ACTIVITY_LABELS.get(
        entry.action,
        entry.action.replace(".", " ").replace("_", " ").title(),
    )
    project_name = entry.project.name if entry.project_id else ""

    if entry.action in {
        "project.file.delete",
        "project.delete",
        "project.share.revoke",
        "project.member.remove",
    }:
        tone = "red"
    elif entry.action in {"project.share.create", "project.share.rotate"}:
        tone = "purple"
    elif entry.action in {"project.create", "project.join", "project.restore"}:
        tone = "green"
    else:
        tone = "blue"

    return {
        "id": f"history-{entry.id}",
        "title": label,
        "subtitle": entry.summary or project_name,
        "created_at": entry.created_at.isoformat(),
        "icon": MODULE_ICONS.get(entry.module, "activity"),
        "tone": tone,
        "username": entry.username,
        "project_name": project_name,
        "count": 1,
    }


def _summarize_recent_activity(entries):
    items = []
    group = None

    def flush_group():
        nonlocal group

        if group:
            items.append(_file_activity_item(group["entries"]))
            group = None

    for entry in entries:
        if entry.action.startswith("project.file."):
            key = (entry.user_id, entry.project_id)

            if (
                group
                and group["key"] == key
                and (group["newest"] - entry.created_at).total_seconds() <= 120
            ):
                group["entries"].append(entry)
                continue

            flush_group()
            group = {
                "key": key,
                "entries": [entry],
                "newest": entry.created_at,
            }
            continue

        flush_group()
        items.append(_entry_activity_item(entry))

    flush_group()

    return items


@csrf_exempt
def recent_activity(request):
    """Compact, grouped activity feed for dashboards (separate from history)."""
    if request.method != "GET":
        return JsonResponse({"success": False, "error": "GET method required."}, status=405)

    user, auth_error = _auth(request)
    if auth_error:
        return auth_error

    limit = _int_param(request.GET.get("limit"), 6, 1, 20)
    entries = list(
        _visible_entries(user).order_by("-created_at", "-id")[:80]
    )
    items = _summarize_recent_activity(entries)

    return JsonResponse({
        "success": True,
        "total": len(items),
        "activities": items[:limit],
    })


@csrf_exempt
def history_list(request):
    if request.method != "GET":
        return JsonResponse({"success": False, "error": "GET method required."}, status=405)

    user, auth_error = _auth(request)
    if auth_error:
        return auth_error

    return _page_response(_visible_entries(user), request.GET)


@csrf_exempt
def project_activity(request, project_id):
    """Project-scoped activity feed with the same visibility rules as history."""
    if request.method != "GET":
        return JsonResponse({"success": False, "error": "GET method required."}, status=405)

    user, auth_error = _auth(request)
    if auth_error:
        return auth_error

    project = (
        Project.objects.select_related("owner")
        .filter(pk=project_id)
        .first()
    )

    if not project or not can_view_project(user, project):
        return JsonResponse(
            {"success": False, "error": "Project not found."},
            status=404,
        )

    response = _page_response(
        _visible_entries(user, project),
        request.GET,
        stats_fn=_activity_stats,
        project={"id": project.id, "name": project.name},
        can_audit=can_audit_project(user, project),
        can_edit=can_view_project(user, project),
    )

    return response


@csrf_exempt
def history_detail(request, entry_id):
    if request.method != "GET":
        return JsonResponse({"success": False, "error": "GET method required."}, status=405)

    user, auth_error = _auth(request)
    if auth_error:
        return auth_error

    entry = ChangeHistory.objects.select_related("project").filter(pk=entry_id).first()
    if not entry:
        return JsonResponse({"success": False, "error": "History entry not found."}, status=404)

    if not _can_view_entry(user, entry):
        return JsonResponse(
            {"success": False, "error": "You are not allowed to view this history entry."},
            status=403,
        )

    return JsonResponse({
        "success": True,
        "entry": ChangeHistorySerializer(entry).data,
    })


@csrf_exempt
def history_restore(request, entry_id):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "POST method required."}, status=405)

    user, auth_error = _auth(request)
    if auth_error:
        return auth_error

    entry = ChangeHistory.objects.select_related("project").filter(pk=entry_id).first()
    if not entry:
        return JsonResponse({"success": False, "error": "History entry not found."}, status=404)

    if not _can_restore_entry(user, entry):
        return JsonResponse(
            {"success": False, "error": "You are not allowed to restore this change."},
            status=403,
        )

    if not entry.reversible:
        return JsonResponse(
            {
                "success": False,
                "error": (
                    "This event is not reversible. Use the recovery instructions "
                    "stored in the history entry."
                ),
                "recovery": (entry.metadata or {}).get("recovery", ""),
            },
            status=400,
        )

    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Invalid JSON."}, status=400)

    if body.get("confirm") is not True:
        return JsonResponse(
            {"success": False, "error": "Confirmation is required to restore a change."},
            status=400,
        )

    before = entry.before or {}

    if entry.action == "project.update":
        project_id = before.get("id")
        project = Project.objects.filter(pk=project_id).first()

        if not project:
            return JsonResponse(
                {
                    "success": False,
                    "error": (
                        "The project no longer exists, so this update cannot be "
                        "restored. Create the project again or use a delete "
                        "restore entry."
                    ),
                },
                status=409,
            )

        current = project_snapshot(project)
        serializer = ProjectSerializer(project, data={
            "name": before.get("name", project.name),
            "description": before.get("description", project.description),
            "language": before.get("language", project.language),
            "github_url": before.get("github_url", project.github_url),
            "branch": before.get("branch", project.branch),
        })

        if not serializer.is_valid():
            return JsonResponse(
                {"success": False, "error": "The stored snapshot is not valid.", "details": serializer.errors},
                status=400,
            )

        project = serializer.save()
        record_change(
            user=user,
            module="projects",
            action="project.restore",
            summary=f"Restored project {project.name} from history #{entry.id}",
            project=project,
            resource_type="project",
            resource_id=project.id,
            before=current,
            after=project_snapshot(project),
            metadata={
                "project_name": project.name,
                "owner_id": project.owner_id,
                "owner_username": (
                    project.owner.username if project.owner_id else ""
                ),
                "changed_by": user.username,
                "restores_history_id": entry.id,
            },
            reversible=True,
        )

        return JsonResponse({
            "success": True,
            "project": ProjectSerializer(project).data,
            "message": "Project restored. The original history entry was kept.",
        })

    if entry.action == "project.delete":
        serializer = ProjectSerializer(data={
            "name": before.get("name", "Restored project"),
            "description": before.get("description", ""),
            "language": before.get("language", ""),
            "github_url": before.get("github_url", ""),
            "branch": before.get("branch", "main"),
        })

        if not serializer.is_valid():
            return JsonResponse(
                {"success": False, "error": "The stored snapshot is not valid.", "details": serializer.errors},
                status=400,
            )

        project = serializer.save()
        original_owner = User.objects.filter(pk=before.get("owner_id")).first()
        project.owner = original_owner or user
        project.save(update_fields=["owner"])
        record_change(
            user=user,
            module="projects",
            action="project.restore",
            summary=f"Re-created project {project.name} from history #{entry.id}",
            project=project,
            resource_type="project",
            resource_id=project.id,
            before=None,
            after=project_snapshot(project),
            metadata={
                "project_name": project.name,
                "owner_id": project.owner_id,
                "owner_username": (
                    project.owner.username if project.owner_id else ""
                ),
                "changed_by": user.username,
                "restores_history_id": entry.id,
                "original_project_id": before.get("id"),
            },
            reversible=True,
        )

        return JsonResponse({
            "success": True,
            "project": ProjectSerializer(project).data,
            "message": (
                "Project re-created from the stored snapshot with a new ID. "
                "The original history entry was kept."
            ),
        })

    return JsonResponse(
        {
            "success": False,
            "error": "This action type is not supported for restore.",
        },
        status=400,
    )
