from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    ProjectListCreateView,
    ProjectDetailView,
    RegisterView,
    github_info,
)

urlpatterns = [
    path("projects/", ProjectListCreateView.as_view(), name="projects"),

    path("projects/<int:pk>/", ProjectDetailView.as_view(), name="project-detail"),

    path("register/", RegisterView.as_view(), name="register"),

    path("login/", TokenObtainPairView.as_view(), name="login"),

    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("github-info/", github_info, name="github_info"),
]