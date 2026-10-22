import difflib
import hashlib
import re

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .history import record_change
from .models import Project, ProjectFile
from .project_access import can_edit_project, can_view_project
from .serializers import ProjectFileSerializer


MAX_FILES = 80
MAX_FILE_BYTES = 256 * 1024
MAX_TOTAL_BYTES = 4 * 1024 * 1024
NAME_PATTERN = re.compile(r"^[A-Za-z0-9._/-]+$")


def _project_or_404(pk):
    return get_object_or_404(Project.objects.select_related("owner"), pk=pk)


def _normalize_name(value):
    if not isinstance(value, str):
        return ""

    name = value.strip().replace("\\", "/")
    while name.startswith("./"):
        name = name[2:]
    name = name.lstrip("/")

    if not name or len(name) > 255:
        return ""
    if not NAME_PATTERN.match(name):
        return ""

    parts = name.split("/")
    if any(part in ("", ".", "..") for part in parts):
        return ""

    return name


def _file_snapshot(name, content):
    """Record file metadata, never file contents, in the audit trail."""
    encoded = content.encode("utf-8")
    return {
        "name": name,
        "size": len(encoded),
        "lines": len(content.splitlines()),
        "checksum": hashlib.sha256(encoded).hexdigest()[:12],
    }


def _line_delta(before_content, after_content):
    """Count added and removed lines without storing file contents."""
    added = 0
    removed = 0

    for line in difflib.ndiff(
        before_content.splitlines(),
        after_content.splitlines(),
    ):
        if line.startswith("+ "):
            added += 1
        elif line.startswith("- "):
            removed += 1

    return {"lines_added": added, "lines_removed": removed}


def _file_records(project):
    return {file.name: file for file in project.files.all()}


def _history_context(project, user):
    return {
        "project_name": project.name,
        "owner_id": project.owner_id,
        "owner_username": project.owner.username if project.owner_id else "",
        "changed_by": getattr(user, "username", ""),
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def project_files(request, pk):
    project = _project_or_404(pk)

    if not can_view_project(request.user, project):
        return Response(
            {"success": False, "error": "Project not found."},
            status=404,
        )

    files = project.files.select_related("updated_by").all()
    return Response({
        "success": True,
        "project": {
            "id": project.id,
            "name": project.name,
            "can_edit": can_edit_project(request.user, project),
        },
        "files": ProjectFileSerializer(files, many=True).data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def project_files_save(request, pk):
    project = _project_or_404(pk)

    if not can_view_project(request.user, project):
        return Response(
            {"success": False, "error": "Project not found."},
            status=404,
        )

    if not can_edit_project(request.user, project):
        return Response(
            {"success": False, "error": "You cannot edit this project."},
            status=403,
        )

    incoming = request.data.get("files")
    if not isinstance(incoming, list) or not incoming:
        return Response(
            {"success": False, "error": "At least one project file is required."},
            status=400,
        )
    if len(incoming) > MAX_FILES:
        return Response(
            {
                "success": False,
                "error": f"A project can contain at most {MAX_FILES} files.",
            },
            status=400,
        )

    desired = {}
    total_bytes = 0

    for item in incoming:
        if not isinstance(item, dict):
            return Response(
                {"success": False, "error": "Invalid file entry."},
                status=400,
            )

        name = _normalize_name(item.get("name"))
        content = item.get("content")

        if not name or "." not in name.rsplit("/", 1)[-1]:
            return Response(
                {"success": False, "error": "Every file needs a valid name and extension."},
                status=400,
            )
        if not isinstance(content, str):
            return Response(
                {"success": False, "error": f"Invalid content for {name}."},
                status=400,
            )

        lowered = name.lower()
        if lowered in desired:
            return Response(
                {"success": False, "error": f"Duplicate file name: {name}."},
                status=400,
            )

        size = len(content.encode("utf-8"))
        if size > MAX_FILE_BYTES:
            return Response(
                {
                    "success": False,
                    "error": f"{name} exceeds the 256 KB file limit.",
                },
                status=400,
            )

        total_bytes += size
        desired[lowered] = {"name": name, "content": content}

    if total_bytes > MAX_TOTAL_BYTES:
        return Response(
            {"success": False, "error": "The workspace exceeds the 4 MB limit."},
            status=400,
        )

    changed = 0

    with transaction.atomic():
        existing = _file_records(project)
        existing_lower = {name.lower(): file for name, file in existing.items()}
        desired_names = set(desired.keys())

        for lowered, payload in desired.items():
            name = payload["name"]
            content = payload["content"]
            file = existing_lower.get(lowered)

            if file is None:
                ProjectFile.objects.create(
                    project=project,
                    name=name,
                    content=content,
                    updated_by=request.user,
                )
                created = _file_snapshot(name, content)
                record_change(
                    user=request.user,
                    module="projects",
                    action="project.file.create",
                    summary=f"Added file {name} to {project.name}",
                    project=project,
                    resource_type="project_file",
                    resource_id=name,
                    before=None,
                    after=created,
                    metadata={
                        **_history_context(project, request.user),
                        "file_name": name,
                        "change": "created",
                        "lines_added": created["lines"],
                        "lines_removed": 0,
                        "size_delta": created["size"],
                    },
                )
                changed += 1
                continue

            name_changed = file.name != name
            if name_changed:
                collision = ProjectFile.objects.filter(
                    project=project,
                    name=name,
                ).exists()
                if collision:
                    return Response(
                        {"success": False, "error": f"Duplicate file name: {name}."},
                        status=400,
                    )

            content_changed = file.content != content

            if name_changed or content_changed:
                before = _file_snapshot(file.name, file.content)
                after = _file_snapshot(name, content)
                delta = (
                    _line_delta(file.content, content)
                    if content_changed
                    else {"lines_added": 0, "lines_removed": 0}
                )

                if name_changed:
                    action = "project.file.rename"
                    summary = f"Renamed {file.name} to {name} in {project.name}"
                else:
                    action = "project.file.update"
                    summary = f"Changed {name} in {project.name}"

                file.name = name
                file.content = content
                file.updated_by = request.user
                file.save()
                record_change(
                    user=request.user,
                    module="projects",
                    action=action,
                    summary=summary,
                    project=project,
                    resource_type="project_file",
                    resource_id=name,
                    before=before,
                    after=after,
                    metadata={
                        **_history_context(project, request.user),
                        "file_name": name,
                        "previous_name": before["name"],
                        "change": "renamed" if name_changed else "updated",
                        "content_changed": bool(content_changed),
                        "lines_added": delta["lines_added"],
                        "lines_removed": delta["lines_removed"],
                        "size_delta": after["size"] - before["size"],
                    },
                )
                changed += 1
            elif file.updated_by_id is None:
                file.updated_by = request.user
                file.save(update_fields=["updated_by", "updated_at"])

        for lowered, file in existing_lower.items():
            if lowered in desired_names:
                continue

            deleted = _file_snapshot(file.name, file.content)
            record_change(
                user=request.user,
                module="projects",
                action="project.file.delete",
                summary=f"Deleted {file.name} from {project.name}",
                project=project,
                resource_type="project_file",
                resource_id=file.name,
                before=deleted,
                after=None,
                metadata={
                    **_history_context(project, request.user),
                    "file_name": file.name,
                    "change": "deleted",
                    "lines_added": 0,
                    "lines_removed": deleted["lines"],
                    "size_delta": -deleted["size"],
                },
            )
            file.delete()
            changed += 1

    files = project.files.select_related("updated_by").all()

    return Response({
        "success": True,
        "changed": changed,
        "files": ProjectFileSerializer(files, many=True).data,
    })
