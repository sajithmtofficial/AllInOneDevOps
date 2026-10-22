from rest_framework import serializers
from django.contrib.auth.models import User

from .models import ChangeHistory, Project, ProjectFile, WorkflowRun
from .project_access import can_edit_project, can_manage_project


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )


class ProjectSerializer(serializers.ModelSerializer):
    owner_username = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    can_manage = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "language",
            "github_url",
            "branch",
            "created_at",
            "owner",
            "owner_username",
            "members",
            "member_count",
            "is_owner",
            "is_member",
            "can_manage",
            "can_edit",
        ]
        read_only_fields = ["created_at", "owner"]

    def _request_user(self):
        request = self.context.get("request")
        return getattr(request, "user", None)

    def get_owner_username(self, obj):
        return obj.owner.username if obj.owner_id else ""

    def get_members(self, obj):
        return [
            {
                "id": membership.user_id,
                "username": membership.user.username,
                "role": membership.role,
                "joined_at": membership.joined_at,
            }
            for membership in obj.memberships.all()
        ]

    def get_member_count(self, obj):
        return len(obj.memberships.all())

    def get_is_owner(self, obj):
        user = self._request_user()
        return bool(
            user
            and getattr(user, "is_authenticated", False)
            and obj.owner_id == user.id
        )

    def get_is_member(self, obj):
        user = self._request_user()
        if not user or not getattr(user, "is_authenticated", False):
            return False
        return any(m.user_id == user.id for m in obj.memberships.all())

    def get_can_manage(self, obj):
        return can_manage_project(self._request_user(), obj)

    def get_can_edit(self, obj):
        return can_edit_project(self._request_user(), obj)


class ProjectFileSerializer(serializers.ModelSerializer):
    updated_by_username = serializers.CharField(
        source="updated_by.username",
        read_only=True,
        default="",
    )

    class Meta:
        model = ProjectFile
        fields = [
            "id",
            "name",
            "content",
            "updated_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "updated_by_username",
            "created_at",
            "updated_at",
        ]


class ChangeHistorySerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = ChangeHistory
        fields = [
            "id",
            "username",
            "module",
            "action",
            "summary",
            "result",
            "project",
            "project_name",
            "resource_type",
            "resource_id",
            "before",
            "after",
            "metadata",
            "reversible",
            "created_at",
        ]


class WorkflowRunSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = WorkflowRun
        fields = [
            "id",
            "external_id",
            "project",
            "project_name",
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
        ]
