from django.contrib import admin

from .models import (
    ChangeHistory,
    Project,
    ProjectFile,
    ProjectMembership,
    ProjectShareLink,
    WorkflowRun,
)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "owner", "language", "branch", "created_at")
    list_filter = ("language",)
    search_fields = ("name", "language", "github_url", "owner__username")


@admin.register(ProjectFile)
class ProjectFileAdmin(admin.ModelAdmin):
    list_display = ("project", "name", "updated_by", "updated_at")
    search_fields = ("project__name", "name", "updated_by__username")
    readonly_fields = ("created_at", "updated_at")


@admin.register(ProjectMembership)
class ProjectMembershipAdmin(admin.ModelAdmin):
    list_display = ("project", "user", "role", "joined_at")
    search_fields = ("project__name", "user__username")


@admin.register(ProjectShareLink)
class ProjectShareLinkAdmin(admin.ModelAdmin):
    list_display = ("project", "token", "created_by", "created_at")
    search_fields = ("project__name", "token")
    readonly_fields = ("token", "created_at")


@admin.register(WorkflowRun)
class WorkflowRunAdmin(admin.ModelAdmin):
    list_display = ("external_id", "engine", "project", "status", "username", "started_at")
    list_filter = ("engine", "status")
    search_fields = ("external_id", "repository", "username")
    readonly_fields = (
        "id",
        "external_id",
        "project",
        "user",
        "username",
        "engine",
        "repository",
        "branch",
        "status",
        "stages",
        "image",
        "container",
        "deployment",
        "jenkins_job",
        "jenkins_build",
        "jenkins_url",
        "error",
        "started_at",
        "finished_at",
    )

    def has_add_permission(self, request):
        return False


@admin.register(ChangeHistory)
class ChangeHistoryAdmin(admin.ModelAdmin):
    list_display = ("id", "created_at", "username", "module", "action", "result", "reversible")
    list_filter = ("module", "result", "reversible")
    search_fields = ("username", "action", "summary", "resource_id")
    readonly_fields = (
        "user",
        "username",
        "module",
        "action",
        "summary",
        "result",
        "project",
        "resource_type",
        "resource_id",
        "before",
        "after",
        "metadata",
        "reversible",
        "created_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
