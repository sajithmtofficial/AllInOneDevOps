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

# DevOps API functions
from .devops_api import (
    run_code,
    stop_code,
    ai_assistant,
    ai_health,
)


urlpatterns = [

    # ========================================================
    # PROJECTS
    # ========================================================

    path(
        "projects/",
        ProjectListCreateView.as_view(),
        name="projects",
    ),

    path(
        "projects/<int:pk>/",
        ProjectDetailView.as_view(),
        name="project-detail",
    ),

    # ========================================================
    # AUTHENTICATION
    # ========================================================

    path(
        "register/",
        RegisterView.as_view(),
        name="register",
    ),

    path(
        "login/",
        TokenObtainPairView.as_view(),
        name="login",
    ),

    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    # ========================================================
    # GITHUB
    # ========================================================

    path(
        "github-info/",
        github_info,
        name="github_info",
    ),

    # ========================================================
    # CODE EXECUTION
    # ========================================================

    path(
        "run-code/",
        run_code,
        name="run_code",
    ),

    path(
        "stop-code/",
        stop_code,
        name="stop_code",
    ),

    # ========================================================
    # AI ASSISTANT
    # ========================================================

    path(
        "ai-assistant/",
        ai_assistant,
        name="ai_assistant",
    ),
    path("ai-health/", ai_health, name="ai_health"),
]