import json

from django.contrib.auth.models import User
from django.test import Client, TestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .history import REDACTED, record_change
from .models import ChangeHistory, Project, ProjectShareLink, WorkflowRun


class ApiTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username="test-user",
            password="TestPass123!",
        )
        self.other = User.objects.create_user(
            username="other-user",
            password="TestPass123!",
        )
        self.staff = User.objects.create_user(
            username="staff-user",
            password="TestPass123!",
            is_staff=True,
        )

    def auth(self, user):
        token = RefreshToken.for_user(user).access_token
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def post_json(self, path, payload, user):
        return self.client.post(
            path,
            data=json.dumps(payload),
            content_type="application/json",
            **self.auth(user),
        )

    def patch_json(self, path, payload, user):
        return self.client.patch(
            path,
            data=json.dumps(payload),
            content_type="application/json",
            **self.auth(user),
        )

    def create_project(self):
        response = self.post_json(
            "/api/projects/",
            {
                "name": "Test project",
                "description": "Original description",
                "language": "Python",
                "github_url": "https://github.com/example/project",
                "branch": "main",
            },
            self.user,
        )
        self.assertEqual(response.status_code, 201, response.content)
        return response.json()


class HistoryTests(ApiTestCase):
    def test_history_is_private_and_restore_is_append_only(self):
        project = self.create_project()
        response = self.patch_json(
            f"/api/projects/{project['id']}/",
            {"description": "Updated description"},
            self.user,
        )
        self.assertEqual(response.status_code, 200, response.content)

        response = self.client.get("/api/history/", **self.auth(self.user))
        self.assertEqual(response.status_code, 200)
        history = response.json()["history"]
        update = next(entry for entry in history if entry["action"] == "project.update")

        self.assertTrue(update["reversible"])
        self.assertEqual(update["before"]["description"], "Original description")
        self.assertEqual(update["after"]["description"], "Updated description")

        response = self.client.get(f"/api/history/{update['id']}/", **self.auth(self.other))
        self.assertEqual(response.status_code, 403)

        response = self.post_json(
            f"/api/history/{update['id']}/restore/",
            {"confirm": True},
            self.other,
        )
        self.assertEqual(response.status_code, 403)

        response = self.post_json(
            f"/api/history/{update['id']}/restore/",
            {"confirm": False},
            self.user,
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Confirmation", response.json()["error"])

        before_count = ChangeHistory.objects.count()
        response = self.post_json(
            f"/api/history/{update['id']}/restore/",
            {"confirm": True},
            self.user,
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()["project"]["description"], "Original description")

        self.assertEqual(ChangeHistory.objects.count(), before_count + 1)
        self.assertTrue(ChangeHistory.objects.filter(pk=update["id"]).exists())
        self.assertTrue(
            ChangeHistory.objects.filter(
                action="project.restore",
                metadata__restores_history_id=update["id"],
            ).exists()
        )

    def test_deleted_project_restore_creates_new_id(self):
        project = self.create_project()
        response = self.client.delete(
            f"/api/projects/{project['id']}/",
            **self.auth(self.user),
        )
        self.assertEqual(response.status_code, 204, response.content)

        delete_entry = ChangeHistory.objects.get(action="project.delete")
        self.assertTrue(delete_entry.reversible)

        response = self.post_json(
            f"/api/history/{delete_entry.id}/restore/",
            {"confirm": True},
            self.user,
        )
        self.assertEqual(response.status_code, 200, response.content)
        restored = response.json()["project"]
        self.assertNotEqual(restored["id"], project["id"])
        self.assertEqual(restored["name"], project["name"])

    def test_project_changes_record_owner_and_changed_fields(self):
        project = self.create_project()

        create_entry = ChangeHistory.objects.get(
            action="project.create",
            resource_id=str(project["id"]),
        )
        self.assertEqual(create_entry.metadata["owner_username"], self.user.username)
        self.assertEqual(create_entry.metadata["created_by"], self.user.username)

        self.patch_json(
            f"/api/projects/{project['id']}/",
            {"description": "Audited description"},
            self.user,
        )

        update = ChangeHistory.objects.get(
            action="project.update",
            project_id=project["id"],
        )
        self.assertEqual(update.metadata["changed_fields"], ["description"])
        self.assertEqual(update.metadata["owner_username"], self.user.username)
        self.assertEqual(update.metadata["updated_by"], self.user.username)

    def test_staff_sees_all_history(self):
        self.create_project()
        record_change(
            user=self.other,
            module="projects",
            action="project.update",
            summary="Other event",
            reversible=False,
        )

        response = self.client.get("/api/history/", **self.auth(self.user))
        self.assertEqual(response.status_code, 200)
        self.assertFalse(
            any(entry["username"] == self.other.username for entry in response.json()["history"])
        )

        response = self.client.get("/api/history/", **self.auth(self.staff))
        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            any(entry["username"] == self.other.username for entry in response.json()["history"])
        )

    def test_secrets_are_redacted(self):
        entry = record_change(
            user=self.user,
            module="jenkins",
            action="jenkins.build.trigger",
            summary="Redaction test",
            before={"authorization": "Bearer abc", "name": "visible"},
            metadata={"password": "secret", "nested": {"api_token": "secret"}},
        )

        self.assertEqual(entry.before["authorization"], REDACTED)
        self.assertEqual(entry.before["name"], "visible")
        self.assertEqual(entry.metadata["password"], REDACTED)
        self.assertEqual(entry.metadata["nested"]["api_token"], REDACTED)


class WorkflowTests(ApiTestCase):
    def test_workflow_status_is_private(self):
        run = WorkflowRun.objects.create(
            external_id="workflow-test-1",
            user=self.user,
            username=self.user.username,
            engine="builtin",
            repository="https://github.com/example/project",
            branch="main",
            status="success",
            stages=[{"name": "Source Checkout", "status": "success", "logs": "real"}],
        )

        response = self.client.get(
            f"/api/pipeline/status/{run.external_id}/",
            **self.auth(self.other),
        )
        self.assertEqual(response.status_code, 403)

        response = self.client.get(
            f"/api/pipeline/status/{run.external_id}/",
            **self.auth(self.user),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["job"]["id"], run.external_id)

        response = self.client.get("/api/pipeline/runs/", **self.auth(self.other))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["runs"], [])

        response = self.client.get("/api/pipeline/runs/", **self.auth(self.staff))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["runs"]), 1)

    def test_jenkins_workflow_requires_staff(self):
        response = self.post_json(
            "/api/pipeline/run/",
            {
                "repo_url": "https://github.com/example/project",
                "engine": "jenkins",
                "jenkins_job": "example-job",
            },
            self.user,
        )
        self.assertEqual(response.status_code, 403)
        self.assertIn("Staff", response.json()["error"])

    def test_jenkins_trigger_requires_staff(self):
        response = self.client.post(
            "/api/jenkins/jobs/example-job/build/",
            **self.auth(self.user),
        )
        self.assertEqual(response.status_code, 403)
        self.assertIn("Staff", response.json()["error"])
        self.assertTrue(
            ChangeHistory.objects.filter(
                action="jenkins.build.trigger",
                result="failed",
            ).exists()
        )


class DockerPermissionTests(ApiTestCase):
    def test_external_container_actions_are_forbidden(self):
        response = self.client.post(
            "/api/docker/containers/not-managed-container/start/",
            **self.auth(self.user),
        )
        self.assertEqual(response.status_code, 403)

    def test_invalid_image_names_are_rejected(self):
        response = self.client.post(
            "/api/docker/images/-bad/remove/",
            **self.auth(self.staff),
        )
        self.assertEqual(response.status_code, 400)


class ProjectSharingTests(ApiTestCase):
    def create_share(self, project, user):
        response = self.post_json(
            f"/api/projects/{project['id']}/share/",
            {},
            user,
        )
        self.assertEqual(response.status_code, 201, response.content)
        return response.json()["share"]

    def test_share_link_join_edit_and_remove_member(self):
        project = self.create_project()

        response = self.client.get(
            f"/api/projects/{project['id']}/share/",
            **self.auth(self.other),
        )
        self.assertEqual(response.status_code, 404)

        share = self.create_share(project, self.user)
        self.assertTrue(share["token"])
        self.assertTrue(share["path"].startswith("/join/"))

        response = self.client.get(
            f"/api/projects/share/{share['token']}/",
            **self.auth(self.other),
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.assertFalse(response.json()["joined"])

        response = self.post_json(
            f"/api/projects/share/{share['token']}/join/",
            {},
            self.other,
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.assertTrue(response.json()["project"]["is_member"])

        response = self.client.get("/api/projects/", **self.auth(self.other))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

        response = self.patch_json(
            f"/api/projects/{project['id']}/",
            {"description": "Edited by collaborator"},
            self.other,
        )
        self.assertEqual(response.status_code, 200, response.content)

        response = self.client.delete(
            f"/api/projects/{project['id']}/",
            **self.auth(self.other),
        )
        self.assertEqual(response.status_code, 403)

        response = self.client.delete(
            f"/api/projects/{project['id']}/members/{self.other.id}/",
            **self.auth(self.user),
        )
        self.assertEqual(response.status_code, 200, response.content)

        response = self.client.get("/api/projects/", **self.auth(self.other))
        self.assertEqual(response.json(), [])

    def test_share_link_changes_are_audited_with_url(self):
        project = self.create_project()
        share = self.create_share(project, self.user)

        created = ChangeHistory.objects.get(action="project.share.create")
        self.assertEqual(created.username, self.user.username)
        self.assertTrue(created.after["active"])
        self.assertEqual(created.after["path"], share["path"])
        self.assertEqual(created.metadata["share_url"], share["url"])
        self.assertEqual(created.metadata["share_path"], share["path"])
        self.assertEqual(created.metadata["owner_name"], self.user.username)

        response = self.post_json(
            f"/api/projects/{project['id']}/share/",
            {"rotate": True},
            self.user,
        )
        self.assertEqual(response.status_code, 201, response.content)

        rotated = ChangeHistory.objects.get(action="project.share.rotate")
        self.assertNotEqual(rotated.before["url"], rotated.after["url"])
        self.assertEqual(rotated.metadata["share_url"], rotated.after["url"])

        response = self.client.delete(
            f"/api/projects/{project['id']}/share/",
            **self.auth(self.user),
        )
        self.assertEqual(response.status_code, 200, response.content)

        revoked = ChangeHistory.objects.get(action="project.share.revoke")
        self.assertTrue(revoked.before["active"])
        self.assertFalse(revoked.after["active"])
        self.assertIn("/join/", revoked.metadata["share_path"])

    def test_join_and_member_removal_are_audited(self):
        project = self.create_project()
        share = self.create_share(project, self.user)
        self.post_json(
            f"/api/projects/share/{share['token']}/join/",
            {},
            self.other,
        )

        joined = ChangeHistory.objects.get(action="project.join")
        self.assertEqual(joined.metadata["member_username"], self.other.username)
        self.assertEqual(joined.metadata["owner_name"], self.user.username)
        self.assertEqual(joined.metadata["share_url"], share["url"])
        self.assertIn(
            self.other.username,
            [member["username"] for member in joined.after["members"]],
        )

        response = self.client.delete(
            f"/api/projects/{project['id']}/members/{self.other.id}/",
            **self.auth(self.user),
        )
        self.assertEqual(response.status_code, 200, response.content)

        removed = ChangeHistory.objects.get(action="project.member.remove")
        self.assertEqual(removed.metadata["removed_username"], self.other.username)
        self.assertEqual(removed.metadata["owner_name"], self.user.username)
        self.assertNotIn(
            self.other.username,
            [member["username"] for member in removed.after["members"]],
        )

    def test_revoked_link_cannot_be_joined(self):
        project = self.create_project()
        share = self.create_share(project, self.user)

        response = self.client.delete(
            f"/api/projects/{project['id']}/share/",
            **self.auth(self.user),
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.assertIsNone(response.json()["share"])

        response = self.client.get(
            f"/api/projects/share/{share['token']}/",
            **self.auth(self.other),
        )
        self.assertEqual(response.status_code, 404)

        response = self.post_json(
            f"/api/projects/share/{share['token']}/join/",
            {},
            self.other,
        )
        self.assertEqual(response.status_code, 404)

    def test_member_sees_only_own_history_but_owner_sees_all(self):
        project = self.create_project()
        share = self.create_share(project, self.user)
        self.post_json(
            f"/api/projects/share/{share['token']}/join/",
            {},
            self.other,
        )

        update = self.patch_json(
            f"/api/projects/{project['id']}/",
            {"description": "Owner edit"},
            self.user,
        )
        self.assertEqual(update.status_code, 200, update.content)

        response = self.client.get("/api/history/", **self.auth(self.other))
        self.assertEqual(response.status_code, 200)
        actions = [entry["action"] for entry in response.json()["history"]]
        self.assertIn("project.join", actions)
        self.assertNotIn("project.update", actions)
        self.assertNotIn("project.create", actions)
        self.assertTrue(
            all(
                entry["username"] == self.other.username
                for entry in response.json()["history"]
            )
        )

        response = self.client.get("/api/history/", **self.auth(self.user))
        self.assertEqual(response.status_code, 200)
        owner_actions = [entry["action"] for entry in response.json()["history"]]
        self.assertIn("project.update", owner_actions)
        self.assertIn("project.join", owner_actions)

        update_entry = ChangeHistory.objects.get(
            action="project.update",
            project_id=project["id"],
        )
        response = self.client.get(
            f"/api/history/{update_entry.id}/",
            **self.auth(self.other),
        )
        self.assertEqual(response.status_code, 403)

        response = self.post_json(
            f"/api/history/{update_entry.id}/restore/",
            {"confirm": True},
            self.other,
        )
        self.assertEqual(response.status_code, 403)

    def test_history_search_matches_project_and_actor(self):
        project = self.create_project()
        self.patch_json(
            f"/api/projects/{project['id']}/",
            {"description": "Searchable update"},
            self.user,
        )

        response = self.client.get(
            "/api/history/?q=Test%20project",
            **self.auth(self.user),
        )
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()["history"]), 2)

        response = self.client.get(
            "/api/history/?q=test-user",
            **self.auth(self.user),
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            all(
                entry["username"] == self.user.username
                for entry in response.json()["history"]
            )
        )

    def test_ownerless_project_is_hidden_from_non_staff(self):
        project = Project.objects.create(
            name="Orphan project",
            description="Created before ownership",
            language="Python",
        )

        response = self.client.get("/api/projects/", **self.auth(self.other))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

        response = self.patch_json(
            f"/api/projects/{project.id}/",
            {"description": "Unauthorized edit"},
            self.other,
        )
        self.assertEqual(response.status_code, 404)

        response = self.client.get("/api/projects/", **self.auth(self.staff))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)


class SharedProjectFilesTests(ApiTestCase):
    def setUp(self):
        super().setUp()
        self.project = self.create_project()
        response = self.post_json(
            f"/api/projects/{self.project['id']}/share/",
            {},
            self.user,
        )
        self.share = response.json()["share"]
        self.post_json(
            f"/api/projects/share/{self.share['token']}/join/",
            {},
            self.other,
        )

    def save_files(self, files, user=None):
        return self.post_json(
            f"/api/projects/{self.project['id']}/files/save/",
            {"files": files},
            user or self.other,
        )

    def test_shared_member_can_save_files_and_owner_sees_history(self):
        response = self.client.get(
            f"/api/projects/{self.project['id']}/files/",
            **self.auth(self.other),
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()["files"], [])

        response = self.save_files([
            {"name": "login.html", "content": "<h1>Login</h1>"},
            {"name": "views.py", "content": "def login():\n    return 'ok'\n"},
        ])
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()["changed"], 2)
        self.assertEqual(len(response.json()["files"]), 2)

        response = self.client.get(
            "/api/history/?q=login.html",
            **self.auth(self.user),
        )
        self.assertEqual(response.status_code, 200)
        entry = response.json()["history"][0]
        self.assertEqual(entry["username"], self.other.username)
        self.assertEqual(entry["action"], "project.file.create")
        self.assertIn("login.html", entry["summary"])
        self.assertIn("Test project", entry["summary"])

        response = self.save_files([
            {"name": "login.html", "content": "<h1>Shared login</h1>"},
            {"name": "views.py", "content": "def login():\n    return 'ok'\n"},
        ])
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()["changed"], 1)

        update = ChangeHistory.objects.get(
            action="project.file.update",
            resource_id="login.html",
        )
        self.assertEqual(update.username, self.other.username)
        self.assertEqual(update.before["name"], "login.html")
        self.assertEqual(update.after["name"], "login.html")
        self.assertNotEqual(update.before["size"], update.after["size"])
        self.assertNotIn("preview", update.after)

        response = self.save_files([
            {"name": "login.html", "content": "<h1>Shared login</h1>"},
        ])
        self.assertEqual(response.status_code, 200, response.content)
        self.assertTrue(
            ChangeHistory.objects.filter(
                action="project.file.delete",
                resource_id="views.py",
                project_id=self.project["id"],
            ).exists()
        )

    def test_file_history_snapshots_track_before_and_after(self):
        self.save_files([{"name": "notes.txt", "content": "one\ntwo\n"}])
        created = ChangeHistory.objects.get(
            action="project.file.create",
            resource_id="notes.txt",
        )
        self.assertIsNone(created.before)
        self.assertEqual(created.after["name"], "notes.txt")
        self.assertEqual(created.after["lines"], 2)
        self.assertEqual(created.metadata["lines_added"], 2)

        self.save_files([{"name": "notes.txt", "content": "one\ntwo\nthree\n"}])
        updated = ChangeHistory.objects.get(
            action="project.file.update",
            resource_id="notes.txt",
        )
        self.assertEqual(
            updated.before["checksum"],
            created.after["checksum"],
        )
        self.assertEqual(updated.after["lines"], 3)
        self.assertEqual(updated.metadata["lines_added"], 1)
        self.assertEqual(updated.metadata["lines_removed"], 0)

        self.save_files([{"name": "NOTES.txt", "content": "one\ntwo\nthree\n"}])
        renamed = ChangeHistory.objects.get(
            action="project.file.rename",
            resource_id="NOTES.txt",
        )
        self.assertEqual(renamed.before["name"], "notes.txt")
        self.assertEqual(renamed.after["name"], "NOTES.txt")

        self.save_files([{"name": "keep.txt", "content": "keep\n"}])
        deleted = ChangeHistory.objects.get(
            action="project.file.delete",
            resource_id="NOTES.txt",
        )
        self.assertEqual(deleted.before["name"], "NOTES.txt")
        self.assertIsNone(deleted.after)
        self.assertEqual(deleted.metadata["lines_removed"], 3)

    def test_file_changes_record_owner_and_actor(self):
        response = self.save_files([
            {"name": "audit.py", "content": "print('audit')\n"},
        ])
        self.assertEqual(response.status_code, 200, response.content)

        entry = ChangeHistory.objects.get(
            action="project.file.create",
            resource_id="audit.py",
        )
        self.assertEqual(entry.username, self.other.username)
        self.assertEqual(entry.metadata["owner_username"], self.user.username)
        self.assertEqual(entry.metadata["changed_by"], self.other.username)
        self.assertEqual(entry.metadata["file_name"], "audit.py")
        self.assertEqual(entry.after["name"], "audit.py")

    def test_owner_sees_every_file_change_but_member_sees_own(self):
        self.save_files(
            [{"name": "owner.py", "content": "print('owner')\n"}],
            self.user,
        )

        response = self.client.get(
            "/api/history/?q=owner.py",
            **self.auth(self.other),
        )
        self.assertEqual(response.json()["history"], [])

        self.save_files([
            {"name": "owner.py", "content": "print('owner')\n"},
            {"name": "member.py", "content": "print('member')\n"},
        ])

        member_history = self.client.get(
            "/api/history/",
            **self.auth(self.other),
        ).json()["history"]
        self.assertTrue(
            all(entry["username"] == self.other.username for entry in member_history)
        )
        self.assertIn(
            "member.py",
            {entry["resource_id"] for entry in member_history},
        )
        self.assertNotIn(
            "owner.py",
            {entry["resource_id"] for entry in member_history},
        )

        owner_history = self.client.get(
            "/api/history/",
            **self.auth(self.user),
        ).json()["history"]
        owner_resources = {entry["resource_id"] for entry in owner_history}
        self.assertIn("owner.py", owner_resources)
        self.assertIn("member.py", owner_resources)

    def test_non_member_cannot_read_or_save_files(self):
        outsider = User.objects.create_user(
            username="outsider",
            password="TestPass123!",
        )

        response = self.client.get(
            f"/api/projects/{self.project['id']}/files/",
            **self.auth(outsider),
        )
        self.assertEqual(response.status_code, 404)

        response = self.save_files(
            [{"name": "secret.txt", "content": "nope"}],
            outsider,
        )
        self.assertEqual(response.status_code, 404)

    def test_invalid_file_paths_are_rejected(self):
        response = self.save_files([
            {"name": "../secret.txt", "content": "nope"},
        ])
        self.assertEqual(response.status_code, 400)
        self.assertIn("valid name", response.json()["error"])

    def test_rename_persists_when_content_is_unchanged(self):
        response = self.save_files([
            {"name": "login.html", "content": "<h1>Login</h1>"},
        ])
        self.assertEqual(response.status_code, 200, response.content)

        response = self.save_files([
            {"name": "LOGIN.html", "content": "<h1>Login</h1>"},
        ])
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()["changed"], 1)

        response = self.client.get(
            f"/api/projects/{self.project['id']}/files/",
            **self.auth(self.other),
        )
        self.assertEqual(
            [file_entry["name"] for file_entry in response.json()["files"]],
            ["LOGIN.html"],
        )

        rename = ChangeHistory.objects.get(
            action="project.file.rename",
            resource_id="LOGIN.html",
        )
        self.assertIn("Renamed login.html to LOGIN.html", rename.summary)
        self.assertEqual(rename.before["name"], "login.html")
        self.assertEqual(rename.after["name"], "LOGIN.html")

    def test_member_cannot_manage_share_link(self):
        response = self.post_json(
            f"/api/projects/{self.project['id']}/share/",
            {"rotate": True},
            self.other,
        )
        self.assertEqual(response.status_code, 403)

        response = self.client.delete(
            f"/api/projects/{self.project['id']}/share/",
            **self.auth(self.other),
        )
        self.assertEqual(response.status_code, 403)

        share = ProjectShareLink.objects.get(project_id=self.project["id"])
        self.assertEqual(str(share.token), self.share["token"])


class ProjectActivityApiTests(ApiTestCase):
    def setUp(self):
        super().setUp()
        self.project = self.create_project()
        response = self.post_json(
            f"/api/projects/{self.project['id']}/share/",
            {},
            self.user,
        )
        self.share = response.json()["share"]
        self.post_json(
            f"/api/projects/share/{self.share['token']}/join/",
            {},
            self.other,
        )

    def save_files(self, files, user=None):
        return self.post_json(
            f"/api/projects/{self.project['id']}/files/save/",
            {"files": files},
            user or self.other,
        )

    def activity(self, user, query=""):
        return self.client.get(
            f"/api/projects/{self.project['id']}/activity/{query}",
            **self.auth(user),
        )

    def test_project_activity_is_paginated_newest_first(self):
        self.save_files([{"name": "sara.py", "content": "print(1)\n"}])
        self.save_files(
            [
                {"name": "sara.py", "content": "print(1)\n"},
                {"name": "owner.py", "content": "print(2)\n"},
            ],
            self.user,
        )

        response = self.activity(self.user, "?action=project.file&limit=1")
        self.assertEqual(response.status_code, 200, response.content)
        first = response.json()
        self.assertEqual(first["total"], 2)
        self.assertEqual(first["count"], 1)
        self.assertTrue(first["has_more"])
        self.assertEqual(first["next_offset"], 1)
        self.assertEqual(first["history"][0]["resource_id"], "owner.py")
        self.assertEqual(first["stats"]["total"], 2)
        self.assertEqual(first["stats"]["files"], 2)
        self.assertEqual(first["stats"]["contributors"], 2)

        response = self.activity(
            self.user,
            "?action=project.file&limit=1&offset=1",
        )
        second = response.json()
        self.assertEqual(second["count"], 1)
        self.assertFalse(second["has_more"])
        self.assertIsNone(second["next_offset"])
        self.assertEqual(second["history"][0]["resource_id"], "sara.py")

    def test_project_activity_filters_by_file_path(self):
        self.save_files([{"name": "login.html", "content": "<h1>Login</h1>"}])
        self.save_files([{"name": "LOGIN.html", "content": "<h1>Login</h1>"}])
        self.save_files([
            {"name": "LOGIN.html", "content": "<h1>Login</h1>"},
            {"name": "other.html", "content": "<h1>Other</h1>"},
        ])

        response = self.activity(self.user, "?file=login.html")
        self.assertEqual(response.status_code, 200, response.content)
        body = response.json()
        self.assertEqual(body["total"], 2)
        actions = {entry["action"] for entry in body["history"]}
        self.assertEqual(
            actions,
            {"project.file.create", "project.file.rename"},
        )

    def test_project_activity_requires_project_access(self):
        outsider = User.objects.create_user(
            username="outsider",
            password="TestPass123!",
        )

        response = self.activity(outsider)
        self.assertEqual(response.status_code, 404)

        response = self.activity(self.other)
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()["project"]["id"], self.project["id"])

    def test_member_activity_is_limited_to_their_own_actions(self):
        self.save_files([{"name": "sara.py", "content": "print('sara')\n"}])
        self.save_files(
            [{"name": "owner.py", "content": "print('owner')\n"}],
            self.user,
        )

        response = self.activity(self.other)
        body = response.json()
        self.assertFalse(body["can_audit"])
        self.assertTrue(body["history"])
        self.assertEqual(
            {entry["username"] for entry in body["history"]},
            {self.other.username},
        )
        self.assertIn(
            "project.file.create",
            {entry["action"] for entry in body["history"]},
        )

        response = self.activity(self.user)
        body = response.json()
        self.assertTrue(body["can_audit"])
        self.assertIn(
            self.other.username,
            {entry["username"] for entry in body["history"]},
        )


class RecentActivityApiTests(ApiTestCase):
    def setUp(self):
        super().setUp()
        self.project = self.create_project()
        share = self.post_json(
            f"/api/projects/{self.project['id']}/share/",
            {},
            self.user,
        ).json()["share"]
        self.post_json(
            f"/api/projects/share/{share['token']}/join/",
            {},
            self.other,
        )

    def recent(self, user, query=""):
        return self.client.get(
            f"/api/activity/recent/{query}",
            **self.auth(user),
        )

    def test_recent_activity_groups_files_and_respects_member_visibility(self):
        self.post_json(
            f"/api/projects/{self.project['id']}/files/save/",
            {
                "files": [
                    {"name": "a.py", "content": "print(1)\n"},
                    {"name": "b.py", "content": "print(2)\n"},
                ]
            },
            self.other,
        )
        self.post_json(
            f"/api/projects/{self.project['id']}/share/",
            {"rotate": True},
            self.user,
        )

        member = self.recent(self.other).json()
        self.assertTrue(member["activities"])
        self.assertEqual(
            {item["username"] for item in member["activities"]},
            {self.other.username},
        )
        file_items = [
            item for item in member["activities"] if item["count"] > 1
        ]
        self.assertEqual(len(file_items), 1)
        self.assertEqual(file_items[0]["count"], 2)

        owner = self.recent(self.user).json()
        self.assertTrue(
            any(item["count"] == 2 for item in owner["activities"])
        )
        self.assertTrue(
            any(
                item["username"] == self.user.username
                and "Share" in item["title"]
                for item in owner["activities"]
            )
        )

    def test_recent_activity_requires_authentication(self):
        response = self.client.get("/api/activity/recent/")
        self.assertEqual(response.status_code, 401)
