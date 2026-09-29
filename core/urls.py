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

from .devops_api import (
    run_code,
    stop_code,
    ai_assistant,
)

from .execute_views import (
    execute_code,
    stop_code as stop_execution,
)

from .pipeline_views import (
    pipeline_run,
    pipeline_status,
)


urlpatterns = [
    # =================================================
    # PROJECTS
    # =================================================

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

    # =================================================
    # AUTHENTICATION
    # =================================================

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

    # =================================================
    # GITHUB
    # =================================================

    path(
        "github-info/",
        github_info,
        name="github_info",
    ),

    # =================================================
    # EXISTING CODE RUNNER
    # =================================================

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

    # =================================================
    # OLLAMA AI ASSISTANT
    # =================================================

    path(
        "ai-assistant/",
        ai_assistant,
        name="ai_assistant",
    ),

    # =================================================
    # MULTI-LANGUAGE DOCKER EXECUTION
    # =================================================

    path(
        "execute/",
        execute_code,
        name="execute_code",
    ),

    path(
        "stop-execution/",
        stop_execution,
        name="stop_execution",
    ),

    # =================================================
    # CI/CD PIPELINE
    # =================================================

    path(
        "pipeline/run/",
        pipeline_run,
        name="pipeline_run",
    ),

    path(
        "pipeline/status/<str:job_id>/",
        pipeline_status,
        name="pipeline_status",
    ),
]