from .github_service import get_repo_info
from django.contrib.auth.models import User
from rest_framework import generics

from .models import Project
from .serializers import ProjectSerializer, RegisterSerializer


class ProjectListCreateView(generics.ListCreateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def github_info(request):
    repo_url = request.GET.get("repo")

    if not repo_url:
        return Response({"error": "Repository URL is required"}, status=400)

    data = get_repo_info(repo_url)

    if data:
        return Response(data)

    return Response({"error": "Repository not found"}, status=404)    