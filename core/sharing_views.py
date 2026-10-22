import uuid

from django.conf import settings
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .history import record_change
from .models import Project, ProjectMembership, ProjectShareLink
from .project_access import (
    can_manage_project,
    can_view_project,
    is_project_member,
)
from .serializers import ProjectSerializer


def _project_queryset():
    return Project.objects.select_related("owner").prefetch_related(
        "memberships__user"
    )


def _share_url(token):
    base = getattr(
        settings,
        "FRONTEND_URL",
        "http://localhost:5173",
    ).rstrip("/")
    path = f"/join/{token}"
    return path, f"{base}{path}"


def _owner_username(project):
    return project.owner.username if project.owner_id else ""


def _share_snapshot(project):
    """Describe the project's invite link for the audit trail."""
    link = ProjectShareLink.objects.filter(project=project).first()

    if not link:
        return {"active": False}

    path, url = _share_url(link.token)

    return {
        "active": True,
        "path": path,
        "url": url,
        "created_by": link.created_by.username if link.created_by_id else "",
        "created_at": link.created_at.isoformat() if link.created_at else None,
    }


def _member_snapshot(project):
    """Describe the current collaborators so joins/leaves are readable."""
    memberships = (
        ProjectMembership.objects.filter(project=project)
        .select_related("user")
        .order_by("joined_at")
    )

    return {
        "members": [
            {
                "id": membership.user_id,
                "username": membership.user.username,
                "role": membership.role,
            }
            for membership in memberships
        ]
    }


def _share_payload(project, request):
    link = ProjectShareLink.objects.filter(project=project).first()
    share = None

    if link:
        path, url = _share_url(link.token)
        share = {
            "token": str(link.token),
            "path": path,
            "url": url,
            "created_at": link.created_at,
            "created_by": link.created_by.username if link.created_by_id else "",
        }

    return {
        "success": True,
        "project": ProjectSerializer(project, context={"request": request}).data,
        "share": share,
    }


@api_view(["GET", "POST", "DELETE"])
@permission_classes([IsAuthenticated])
def project_share(request, pk):
    project = get_object_or_404(_project_queryset(), pk=pk)

    if not can_view_project(request.user, project):
        return Response(
            {"success": False, "error": "Project not found."},
            status=404,
        )

    if not can_manage_project(request.user, project):
        return Response(
            {
                "success": False,
                "error": "Only the project owner can manage sharing.",
            },
            status=403,
        )

    if request.method == "GET":
        return Response(_share_payload(project, request))

    if request.method == "DELETE":
        link = ProjectShareLink.objects.filter(project=project).first()
        if not link:
            return Response(
                {"success": False, "error": "This project has no active share link."},
                status=404,
            )

        before = _share_snapshot(project)
        link.delete()
        record_change(
            user=request.user,
            module="projects",
            action="project.share.revoke",
            summary=f"Revoked the share link for project {project.name}",
            project=project,
            resource_type="project_share",
            resource_id=project.id,
            before=before,
            after=_share_snapshot(project),
            metadata={
                "project_name": project.name,
                "owner_name": _owner_username(project),
                "changed_by": request.user.username,
                "share_path": before.get("path", ""),
                "share_url": before.get("url", ""),
            },
        )
        return Response(_share_payload(project, request))

    rotate = bool(request.data.get("rotate"))
    link = ProjectShareLink.objects.filter(project=project).first()

    if link and not rotate:
        return Response(_share_payload(project, request))

    before = _share_snapshot(project)

    if link:
        link.token = uuid.uuid4()
        link.created_by = request.user
        link.save(update_fields=["token", "created_by"])
        action = "project.share.rotate"
        summary = f"Regenerated the share link for project {project.name}"
    else:
        ProjectShareLink.objects.create(project=project, created_by=request.user)
        action = "project.share.create"
        summary = f"Created a share link for project {project.name}"

    after = _share_snapshot(_project_queryset().get(pk=project.pk))
    record_change(
        user=request.user,
        module="projects",
        action=action,
        summary=summary,
        project=project,
        resource_type="project_share",
        resource_id=project.id,
        before=before,
        after=after,
        metadata={
            "project_name": project.name,
            "owner_name": _owner_username(project),
            "changed_by": request.user.username,
            "share_path": after.get("path", ""),
            "share_url": after.get("url", ""),
        },
    )

    project = _project_queryset().get(pk=project.pk)
    return Response(_share_payload(project, request), status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def project_share_preview(request, token):
    link = (
        ProjectShareLink.objects.select_related("project", "project__owner")
        .filter(token=token)
        .first()
    )

    if not link:
        return Response(
            {
                "success": False,
                "error": "This share link is invalid or has been revoked.",
            },
            status=404,
        )

    project = _project_queryset().get(pk=link.project_id)
    joined = can_view_project(request.user, project)
    is_owner = project.owner_id == request.user.id

    return Response({
        "success": True,
        "project": ProjectSerializer(
            project,
            context={"request": request},
        ).data,
        "joined": joined,
        "is_owner": is_owner,
        "is_member": is_project_member(request.user, project),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def project_share_join(request, token):
    link = (
        ProjectShareLink.objects.select_related("project")
        .filter(token=token)
        .first()
    )

    if not link:
        return Response(
            {
                "success": False,
                "error": "This share link is invalid or has been revoked.",
            },
            status=404,
        )

    project = _project_queryset().get(pk=link.project_id)
    already_joined = can_view_project(request.user, project)

    if not already_joined:
        before = _member_snapshot(project)
        ProjectMembership.objects.get_or_create(
            project=project,
            user=request.user,
            defaults={"role": "editor"},
        )
        project = _project_queryset().get(pk=project.pk)
        path, url = _share_url(link.token)
        record_change(
            user=request.user,
            module="projects",
            action="project.join",
            summary=f"Joined project {project.name} through a share link",
            project=project,
            resource_type="project_member",
            resource_id=request.user.id,
            before=before,
            after=_member_snapshot(project),
            metadata={
                "project_name": project.name,
                "owner_name": _owner_username(project),
                "member_id": request.user.id,
                "member_username": request.user.username,
                "role": "editor",
                "share_path": path,
                "share_url": url,
            },
        )

    return Response({
        "success": True,
        "joined": True,
        "already_joined": already_joined,
        "project": ProjectSerializer(
            project,
            context={"request": request},
        ).data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def project_leave(request, pk):
    project = get_object_or_404(_project_queryset(), pk=pk)

    if project.owner_id == request.user.id:
        return Response(
            {
                "success": False,
                "error": "Project owners cannot leave their own project.",
            },
            status=400,
        )

    membership = ProjectMembership.objects.filter(
        project=project,
        user=request.user,
    ).first()

    if not membership:
        return Response(
            {"success": False, "error": "You are not a member of this project."},
            status=404,
        )

    before = _member_snapshot(project)
    role = membership.role
    membership.delete()
    record_change(
        user=request.user,
        module="projects",
        action="project.leave",
        summary=f"Left project {project.name}",
        project=project,
        resource_type="project_member",
        resource_id=request.user.id,
        before=before,
        after=_member_snapshot(project),
        metadata={
            "project_name": project.name,
            "owner_name": _owner_username(project),
            "member_id": request.user.id,
            "member_username": request.user.username,
            "role": role,
        },
    )

    return Response({"success": True})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def project_member_remove(request, pk, user_id):
    project = get_object_or_404(_project_queryset(), pk=pk)

    if not can_manage_project(request.user, project):
        return Response(
            {"success": False, "error": "Only the project owner can remove members."},
            status=403,
        )

    if project.owner_id == user_id:
        return Response(
            {"success": False, "error": "The project owner cannot be removed."},
            status=400,
        )

    member = User.objects.filter(pk=user_id).first()
    membership = ProjectMembership.objects.filter(
        project=project,
        user_id=user_id,
    ).first()

    if not membership:
        return Response(
            {"success": False, "error": "Member not found."},
            status=404,
        )

    before = _member_snapshot(project)
    role = membership.role
    membership.delete()
    record_change(
        user=request.user,
        module="projects",
        action="project.member.remove",
        summary=(
            f"Removed {member.username if member else user_id} "
            f"from project {project.name}"
        ),
        project=project,
        resource_type="project_member",
        resource_id=user_id,
        before=before,
        after=_member_snapshot(project),
        metadata={
            "project_name": project.name,
            "owner_name": _owner_username(project),
            "removed_user_id": user_id,
            "removed_username": member.username if member else "",
            "role": role,
            "changed_by": request.user.username,
        },
    )

    return Response({"success": True})
