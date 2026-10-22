from django.db.models import Q

from .models import Project


def accessible_projects(user):
    """Projects a user may open: their own projects and projects shared with them."""
    if not getattr(user, "is_authenticated", False):
        return Project.objects.none()

    projects = Project.objects.select_related("owner").prefetch_related(
        "memberships__user"
    )
    if user.is_staff:
        return projects

    return projects.filter(
        Q(owner=user) | Q(memberships__user=user)
    ).distinct()


def can_view_project(user, project):
    if not getattr(user, "is_authenticated", False) or project is None:
        return False
    if user.is_staff or project.owner_id == user.id:
        return True
    return any(
        membership.user_id == user.id
        for membership in project.memberships.all()
    )


def can_edit_project(user, project):
    return can_view_project(user, project)


def can_manage_project(user, project):
    """Only the owner/staff may delete, share, or manage membership."""
    if not getattr(user, "is_authenticated", False) or project is None:
        return False
    return user.is_staff or project.owner_id == user.id


def auditable_projects(user):
    """Projects whose full activity a user may audit.

    Owners, staff, and the person who created the invite link can review every
    collaborator's changes. Regular members only audit their own entries.
    """
    if not getattr(user, "is_authenticated", False):
        return Project.objects.none()

    if user.is_staff:
        return Project.objects.all()

    return Project.objects.filter(
        Q(owner=user) | Q(share_link__created_by=user)
    ).distinct()


def can_audit_project(user, project):
    if not getattr(user, "is_authenticated", False) or project is None:
        return False
    if user.is_staff or project.owner_id == user.id:
        return True

    link = getattr(project, "share_link", None)
    return bool(link and link.created_by_id == user.id)


def is_project_member(user, project):
    if not getattr(user, "is_authenticated", False) or project is None:
        return False
    return any(
        membership.user_id == user.id
        for membership in project.memberships.all()
    )
