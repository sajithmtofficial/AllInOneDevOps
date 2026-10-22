from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.db import OperationalError, connection
from django.http import HttpResponse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .history import changed_fields, project_snapshot, record_change
from .models import Project
from .project_access import accessible_projects, can_manage_project
from .serializers import ProjectSerializer, RegisterSerializer

from .github_service import (
    get_repo_info,
    get_repo_files,
    get_file_content,
)


class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return accessible_projects(self.request.user)

    def perform_create(self, serializer):
        project = serializer.save(owner=self.request.user)
        record_change(
            user=self.request.user,
            module="projects",
            action="project.create",
            summary=f"Created project {project.name}",
            project=project,
            resource_type="project",
            resource_id=project.id,
            after=project_snapshot(project),
            metadata={
                "project_name": project.name,
                "owner_id": project.owner_id,
                "owner_username": project.owner.username if project.owner_id else "",
                "created_by": self.request.user.username,
            },
            reversible=False,
        )


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return accessible_projects(self.request.user)

    def perform_update(self, serializer):
        before = project_snapshot(serializer.instance)
        project = serializer.save()
        after = project_snapshot(project)

        if before != after:
            fields = changed_fields(before, after)
            record_change(
                user=self.request.user,
                module="projects",
                action="project.update",
                summary=(
                    f"Updated project {project.name} "
                    f"({', '.join(fields) or 'details'})"
                ),
                project=project,
                resource_type="project",
                resource_id=project.id,
                before=before,
                after=after,
                metadata={
                    "project_name": project.name,
                    "owner_id": project.owner_id,
                    "owner_username": (
                        project.owner.username if project.owner_id else ""
                    ),
                    "changed_fields": fields,
                    "updated_by": self.request.user.username,
                },
                reversible=True,
            )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if not can_manage_project(request.user, instance):
            return Response(
                {"error": "Only the project owner can delete this project."},
                status=status.HTTP_403_FORBIDDEN,
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        before = project_snapshot(instance)
        record_change(
            user=self.request.user,
            module="projects",
            action="project.delete",
            summary=f"Deleted project {instance.name}",
            project=instance,
            resource_type="project",
            resource_id=instance.id,
            before=before,
            after=None,
            metadata={
                "note": (
                    "The project can be re-created from the stored snapshot. "
                    "The original project ID is not reused."
                ),
                "project_name": instance.name,
                "owner_id": instance.owner_id,
                "owner_username": (
                    instance.owner.username if instance.owner_id else ""
                ),
                "deleted_by": self.request.user.username,
            },
            reversible=True,
        )
        instance.delete()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response({
        "username": request.user.username,
        "email": request.user.email,
        "is_staff": request.user.is_staff,
    })


@api_view(["GET"])
def github_info(request):
    repo_url = request.GET.get("repo")

    if not repo_url:
        return Response(
            {"error": "Repository URL is required"},
            status=400,
        )

    data = get_repo_info(repo_url)

    if data is None:
        return Response(
            {"error": "Repository not found or inaccessible"},
            status=404,
        )

    return Response(data)


@api_view(["GET"])
def github_files(request):
    repo_url = request.GET.get("repo")

    if not repo_url:
        return Response(
            {"error": "Repository URL is required"},
            status=400,
        )

    data = get_repo_files(repo_url)

    if data is None:
        return Response(
            {
                "error": (
                    "Could not retrieve repository files. "
                    "Check the URL, repository access, "
                    "and GitHub API limits."
                )
            },
            status=404,
        )

    return Response(data)


@api_view(["GET"])
def github_file_content(request):
    repo_url = request.GET.get("repo")
    file_path = request.GET.get("path")
    branch = request.GET.get("branch")

    if not repo_url or not file_path:
        return Response(
            {"error": "Repository URL and file path are required"},
            status=400,
        )

    content = get_file_content(repo_url, file_path, branch)

    if content is None:
        return Response(
            {"error": "Could not retrieve file content"},
            status=404,
        )

    return Response({
        "path": file_path,
        "content": content,
    })


@api_view(["POST"])
def password_reset_request(request):
    email = (request.data.get("email") or "").strip()

    if not email:
        return Response(
            {"error": "Email is required"},
            status=400,
        )

    users = User.objects.filter(email__iexact=email, is_active=True)
    frontend_url = getattr(
        settings,
        "FRONTEND_URL",
        "http://localhost:5173",
    ).rstrip("/")

    for user in users:
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_url = f"{frontend_url}/reset-password/{uid}/{token}"

        if settings.DEBUG:
            print(
                f"\n[password reset] Link for {user.username}:\n"
                f"{reset_url}\n"
            )

        try:
            send_mail(
                subject="Reset your All In One DevOps password",
                message=(
                    f"Hi {user.username},\n\n"
                    "Use the link below to reset your password:\n\n"
                    f"{reset_url}\n\n"
                    "If you did not request this, you can ignore this email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as email_error:
            if not settings.DEBUG:
                return Response(
                    {
                        "error": (
                            "Could not send the password reset email. "
                            "Please try again later."
                        )
                    },
                    status=503,
                )

            print(
                f"\n[password reset] Email delivery failed: {email_error}\n"
                f"[password reset] Link for {user.username}:\n"
                f"{reset_url}\n"
            )

    return Response({
        "message": (
            "If an account with that email exists, "
            "a password reset link has been sent."
        )
    })


@api_view(["POST"])
def password_reset_confirm(request):
    uidb64 = (request.data.get("uid") or "").strip()
    token = (request.data.get("token") or "").strip()
    password = request.data.get("password") or ""

    if not uidb64 or not token or not password:
        return Response(
            {"error": "Invalid password reset request"},
            status=400,
        )

    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid, is_active=True)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response(
            {"error": "This password reset link is invalid"},
            status=400,
        )

    if not default_token_generator.check_token(user, token):
        return Response(
            {"error": "This password reset link is invalid or has expired"},
            status=400,
        )

    try:
        validate_password(password, user)
    except ValidationError as error:
        return Response(
            {"error": error.messages[0]},
            status=400,
        )

    user.set_password(password)
    user.save()

    return Response({
        "message": "Password reset successful. You can sign in now."
    })


@api_view(["GET"])
def health(request):
    database = "ok"

    try:
        connection.ensure_connection()
    except OperationalError:
        database = "unavailable"

    return Response({
        "status": "ok" if database == "ok" else "degraded",
        "service": "All In One DevOps API",
        "database": database,
    })


def home(request):
    return HttpResponse(
        "All In One DevOps Backend is Running"
    )
