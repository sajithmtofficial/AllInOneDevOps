import uuid

from django.conf import settings
from django.db import models


class Project(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    language = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="owned_projects",
    )

    github_url = models.URLField(blank=True)
    branch = models.CharField(max_length=100, default="main")

    def __str__(self):
        return self.name


class ProjectFile(models.Model):
    """Shared text file stored for a project workspace."""

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="files",
    )
    name = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="updated_project_files",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "name"],
                name="unique_project_file_name",
            )
        ]

    def __str__(self):
        return f"{self.project}: {self.name}"


class ProjectMembership(models.Model):
    """A user who can open and edit a shared project."""

    ROLE_CHOICES = [
        ("editor", "Editor"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_memberships",
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="editor")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["joined_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "user"],
                name="unique_project_membership",
            )
        ]

    def __str__(self):
        return f"{self.user} in {self.project}"


class ProjectShareLink(models.Model):
    """One active invite link per project."""

    project = models.OneToOneField(
        Project,
        on_delete=models.CASCADE,
        related_name="share_link",
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_project_share_links",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Share link for {self.project}"


class WorkflowRun(models.Model):
    """Persistent record of a CI/CD workflow execution."""

    STATUS_CHOICES = [
        ("queued", "Queued"),
        ("running", "Running"),
        ("success", "Success"),
        ("failed", "Failed"),
    ]

    ENGINE_CHOICES = [
        ("builtin", "Built-in runner"),
        ("jenkins", "Jenkins"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    external_id = models.CharField(max_length=64, unique=True)
    project = models.ForeignKey(
        Project,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="workflow_runs",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="workflow_runs",
    )
    username = models.CharField(max_length=150, blank=True)

    engine = models.CharField(max_length=20, choices=ENGINE_CHOICES, default="builtin")
    repository = models.CharField(max_length=500, blank=True)
    branch = models.CharField(max_length=100, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="running")
    stages = models.JSONField(default=list, blank=True)

    image = models.CharField(max_length=200, blank=True)
    container = models.CharField(max_length=200, blank=True)
    deployment = models.JSONField(default=dict, blank=True)

    jenkins_job = models.CharField(max_length=200, blank=True)
    jenkins_build = models.IntegerField(null=True, blank=True)
    jenkins_url = models.URLField(blank=True)

    error = models.TextField(blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.external_id} ({self.status})"


class ChangeHistory(models.Model):
    """Append-only audit trail for configuration and operational events."""

    MODULE_CHOICES = [
        ("projects", "Projects"),
        ("docker", "Docker"),
        ("jenkins", "Jenkins"),
        ("cicd", "CI/CD"),
    ]

    RESULT_CHOICES = [
        ("success", "Success"),
        ("failed", "Failed"),
        ("info", "Info"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="change_history",
    )
    username = models.CharField(max_length=150, blank=True)

    module = models.CharField(max_length=40, choices=MODULE_CHOICES)
    action = models.CharField(max_length=100)
    summary = models.CharField(max_length=255)
    result = models.CharField(max_length=20, choices=RESULT_CHOICES, default="success")

    project = models.ForeignKey(
        Project,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="change_history",
    )
    resource_type = models.CharField(max_length=60, blank=True)
    resource_id = models.CharField(max_length=200, blank=True)

    before = models.JSONField(null=True, blank=True)
    after = models.JSONField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    reversible = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Change history"

    def __str__(self):
        return f"{self.module}:{self.action} by {self.username or 'unknown'}"
