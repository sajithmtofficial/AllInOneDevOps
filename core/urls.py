
from django.urls import path

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    ProjectListCreateView,
    ProjectDetailView,
    RegisterView,
    current_user,
    password_reset_request,
    password_reset_confirm,
    health,
    github_info,
    github_files,
    github_file_content,
)

from .sharing_views import (
    project_share,
    project_share_preview,
    project_share_join,
    project_leave,
    project_member_remove,
)

from .project_files_views import (
    project_files,
    project_files_save,
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
    pipeline_config,
    pipeline_run,
    pipeline_status,
    pipeline_runs,
)

from .docker_views import (
    docker_status,
    docker_images,
    docker_containers,
    docker_container_inspect,
    docker_container_logs,
    docker_container_start,
    docker_container_stop,
    docker_remove_container,
    docker_remove_image,
)

from .jenkins_views import (
    jenkins_status,
    jenkins_jobs,
    jenkins_builds,
    jenkins_build_detail,
    jenkins_build_console,
    jenkins_trigger_build,
)

from .history_views import (
    history_list,
    history_detail,
    history_restore,
    project_activity,
    recent_activity,
)


urlpatterns = [
    # HEALTH
    path(
        "health/",
        health,
        name="health",
    ),

    # PROJECTS
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
    path(
        "projects/<int:pk>/files/",
        project_files,
        name="project_files",
    ),
    path(
        "projects/<int:pk>/files/save/",
        project_files_save,
        name="project_files_save",
    ),
    path(
        "projects/<int:project_id>/activity/",
        project_activity,
        name="project_activity",
    ),
    path(
        "projects/<int:pk>/share/",
        project_share,
        name="project_share",
    ),
    path(
        "projects/<int:pk>/leave/",
        project_leave,
        name="project_leave",
    ),
    path(
        "projects/<int:pk>/members/<int:user_id>/",
        project_member_remove,
        name="project_member_remove",
    ),
    path(
        "projects/share/<uuid:token>/",
        project_share_preview,
        name="project_share_preview",
    ),
    path(
        "projects/share/<uuid:token>/join/",
        project_share_join,
        name="project_share_join",
    ),

    # AUTHENTICATION
    path(
        "register/",
        RegisterView.as_view(),
        name="register",
    ),
    path(
        "me/",
        current_user,
        name="current_user",
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
    path(
        "password-reset/",
        password_reset_request,
        name="password_reset",
    ),
    path(
        "password-reset/confirm/",
        password_reset_confirm,
        name="password_reset_confirm",
    ),

    # GITHUB
    path(
        "github-info/",
        github_info,
        name="github_info",
    ),
    path(
        "github-files/",
        github_files,
        name="github_files",
    ),
    path(
        "github-file-content/",
        github_file_content,
        name="github_file_content",
    ),

    # EXISTING CODE RUNNER
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

    # AI ASSISTANT
    path(
        "ai-assistant/",
        ai_assistant,
        name="ai_assistant",
    ),

    # MULTI-LANGUAGE EXECUTION
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

    # CI/CD
    path(
        "pipeline/config/",
        pipeline_config,
        name="pipeline_config",
    ),
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
    path(
        "pipeline/runs/",
        pipeline_runs,
        name="pipeline_runs",
    ),

    # DOCKER
    path(
        "docker/status/",
        docker_status,
        name="docker_status",
    ),
    path(
        "docker/images/",
        docker_images,
        name="docker_images",
    ),
    path(
        "docker/containers/",
        docker_containers,
        name="docker_containers",
    ),
    path(
        "docker/containers/<str:name>/",
        docker_container_inspect,
        name="docker_container_inspect",
    ),
    path(
        "docker/containers/<str:name>/logs/",
        docker_container_logs,
        name="docker_container_logs",
    ),
    path(
        "docker/containers/<str:name>/start/",
        docker_container_start,
        name="docker_container_start",
    ),
    path(
        "docker/containers/<str:name>/stop/",
        docker_container_stop,
        name="docker_container_stop",
    ),
    path(
        "docker/containers/<str:name>/remove/",
        docker_remove_container,
        name="docker_remove_container",
    ),
    path(
        "docker/images/<str:image>/remove/",
        docker_remove_image,
        name="docker_remove_image",
    ),

    # JENKINS
    path(
        "jenkins/status/",
        jenkins_status,
        name="jenkins_status",
    ),
    path(
        "jenkins/jobs/",
        jenkins_jobs,
        name="jenkins_jobs",
    ),
    path(
        "jenkins/jobs/<str:job_name>/builds/",
        jenkins_builds,
        name="jenkins_builds",
    ),
    path(
        "jenkins/jobs/<str:job_name>/builds/<int:build_number>/",
        jenkins_build_detail,
        name="jenkins_build_detail",
    ),
    path(
        "jenkins/jobs/<str:job_name>/builds/<int:build_number>/console/",
        jenkins_build_console,
        name="jenkins_build_console",
    ),
    path(
        "jenkins/jobs/<str:job_name>/build/",
        jenkins_trigger_build,
        name="jenkins_trigger_build",
    ),

    # ACTIVITY FEED
    path(
        "activity/recent/",
        recent_activity,
        name="recent_activity",
    ),

    # CHANGE HISTORY
    path(
        "history/",
        history_list,
        name="history_list",
    ),
    path(
        "history/<int:entry_id>/",
        history_detail,
        name="history_detail",
    ),
    path(
        "history/<int:entry_id>/restore/",
        history_restore,
        name="history_restore",
    ),
]
