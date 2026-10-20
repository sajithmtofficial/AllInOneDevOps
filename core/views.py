
from django.http import HttpResponse
from django.contrib.auth.models import User

from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Project
from .serializers import ProjectSerializer, RegisterSerializer

from .github_service import (
    get_repo_info,
    get_repo_files,
    get_file_content,
)


class ProjectListCreateView(generics.ListCreateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


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


def home(request):
    return HttpResponse(
        "All In One DevOps Backend is Running"
    )
