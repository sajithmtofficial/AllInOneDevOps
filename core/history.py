import os

from .models import ChangeHistory

REDACTED = "***REDACTED***"

SENSITIVE_KEY_PARTS = (
    "password",
    "passwd",
    "token",
    "secret",
    "authorization",
    "api_key",
    "apikey",
    "credential",
    "private_key",
)


def _secret_values():
    names = (
        "JENKINS_API_TOKEN",
        "JENKINS_USER",
        "EMAIL_HOST_PASSWORD",
        "SECRET_KEY",
    )
    return [os.environ.get(name, "") for name in names if os.environ.get(name)]


def redact_text(value):
    if not isinstance(value, str):
        return value

    result = value
    for secret in _secret_values():
        if secret and len(secret) >= 4:
            result = result.replace(secret, REDACTED)
    return result


def redact(value):
    """Recursively redact secret-like keys and known secret values."""
    if isinstance(value, dict):
        cleaned = {}
        for key, item in value.items():
            key_text = str(key)
            if any(part in key_text.lower() for part in SENSITIVE_KEY_PARTS):
                cleaned[key_text] = REDACTED
            else:
                cleaned[key_text] = redact(item)
        return cleaned

    if isinstance(value, (list, tuple)):
        return [redact(item) for item in value]

    if isinstance(value, str):
        return redact_text(value)

    return value


def changed_fields(before, after):
    """Return the sorted field names that differ between two snapshots."""
    if not isinstance(before, dict) or not isinstance(after, dict):
        return []

    return sorted(
        key for key in set(before) | set(after) if before.get(key) != after.get(key)
    )


def project_snapshot(project):
    if project is None:
        return None

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "language": project.language,
        "github_url": project.github_url,
        "branch": project.branch,
        "owner_id": project.owner_id,
        "owner_username": project.owner.username if project.owner_id else "",
        "created_at": project.created_at.isoformat() if project.created_at else None,
    }


def record_change(
    *,
    user,
    module,
    action,
    summary,
    project=None,
    resource_type="",
    resource_id="",
    result="success",
    before=None,
    after=None,
    metadata=None,
    reversible=False,
):
    """Create an append-only audit entry with secrets removed."""
    username = getattr(user, "username", "") if user is not None else ""

    return ChangeHistory.objects.create(
        user=user if getattr(user, "is_authenticated", False) else None,
        username=username,
        module=module,
        action=action,
        summary=summary[:255],
        result=result,
        project=project,
        resource_type=resource_type,
        resource_id=str(resource_id or ""),
        before=redact(before),
        after=redact(after),
        metadata=redact(metadata or {}),
        reversible=bool(reversible),
    )
