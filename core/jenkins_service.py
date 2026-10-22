import os
import re
from urllib.parse import quote, urlsplit, urlunsplit

import requests


JOB_PATTERN = re.compile(r"^[A-Za-z0-9._-]+$")

ENV_HELP = (
    "Set JENKINS_URL (for example http://localhost:8080), and optionally "
    "JENKINS_USER and JENKINS_API_TOKEN in the backend environment or in the "
    "project .env file, then restart the Django server. Set JENKINS_JOB to "
    "use a default job for CI/CD orchestration."
)


def _config():
    return {
        "url": (os.environ.get("JENKINS_URL") or "").strip().rstrip("/"),
        "user": (os.environ.get("JENKINS_USER") or "").strip(),
        "token": (os.environ.get("JENKINS_API_TOKEN") or "").strip(),
        "job": (os.environ.get("JENKINS_JOB") or "").strip(),
        "verify_ssl": (os.environ.get("JENKINS_VERIFY_SSL", "true") or "").lower()
        not in ("0", "false", "no"),
    }


def is_configured():
    return bool(_config()["url"])


def default_job():
    return _config()["job"]


def _auth(config):
    if config["user"] and config["token"]:
        return (config["user"], config["token"])
    return None


def _safe(message):
    config = _config()
    text = str(message or "")
    for secret in (config["token"], config["user"]):
        if secret and len(secret) >= 3:
            text = text.replace(secret, "***")
    return text


def _safe_url(url):
    """Strip any userinfo so credentials embedded in JENKINS_URL never leak."""
    if not url:
        return ""

    parts = urlsplit(url)
    if not parts.username and not parts.password:
        return url

    hostname = parts.hostname or ""
    if parts.port:
        hostname = f"{hostname}:{parts.port}"
    return urlunsplit((parts.scheme, hostname, parts.path, parts.query, parts.fragment))


def _request(method, path, *, params=None, data=None, timeout=20):
    config = _config()

    if not config["url"]:
        return {
            "ok": False,
            "configured": False,
            "status_code": None,
            "data": None,
            "text": "",
            "error": "Jenkins is not configured.",
            "help": ENV_HELP,
        }

    try:
        response = requests.request(
            method,
            f"{config['url']}{path}",
            params=params,
            data=data,
            auth=_auth(config),
            verify=config["verify_ssl"],
            timeout=timeout,
            headers={"Accept": "application/json"},
        )
    except requests.exceptions.RequestException as exc:
        return {
            "ok": False,
            "configured": True,
            "status_code": None,
            "data": None,
            "text": "",
            "error": _safe(str(exc)),
            "help": ENV_HELP,
        }

    text = response.text or ""
    data = None
    try:
        data = response.json()
    except ValueError:
        pass

    return {
        "ok": response.ok,
        "configured": True,
        "status_code": response.status_code,
        "data": data,
        "text": text,
        "error": "" if response.ok else _safe(text[:1000]),
        "version": response.headers.get("X-Jenkins", ""),
        "location": response.headers.get("Location", ""),
    }


def status():
    config = _config()

    if not config["url"]:
        return {
            "configured": False,
            "reachable": False,
            "url": "",
            "credentials_configured": False,
            "default_job": "",
            "error": "Jenkins is not configured.",
            "help": ENV_HELP,
        }

    result = _request("GET", "/api/json", params={"tree": "jobs[name]"}, timeout=10)

    return {
        "configured": True,
        "reachable": bool(result["ok"]),
        "url": _safe_url(config["url"]),
        "credentials_configured": bool(config["user"] and config["token"]),
        "default_job": config["job"],
        "version": result.get("version", ""),
        "error": result.get("error", ""),
        "help": ENV_HELP if not result["ok"] else "",
    }


def list_jobs():
    config = _config()

    if not config["url"]:
        return {
            "configured": False,
            "jobs": [],
            "error": "Jenkins is not configured.",
            "help": ENV_HELP,
        }

    tree = (
        "jobs[name,url,color,description,"
        "lastBuild[number,result,timestamp,duration,url]]"
    )
    result = _request("GET", "/api/json", params={"tree": tree})

    if not result["ok"]:
        return {
            "configured": True,
            "jobs": [],
            "error": result.get("error", "Could not load Jenkins jobs."),
            "help": ENV_HELP,
        }

    jobs = []
    for job in (result["data"] or {}).get("jobs", []):
        last_build = job.get("lastBuild") or {}
        jobs.append({
            "name": job.get("name", ""),
            "url": _safe_url(job.get("url", "")),
            "color": job.get("color", ""),
            "description": job.get("description", ""),
            "last_build": {
                "number": last_build.get("number"),
                "result": last_build.get("result"),
                "timestamp": last_build.get("timestamp"),
                "duration": last_build.get("duration"),
                "url": _safe_url(last_build.get("url", "")),
            } if last_build else None,
        })

    return {
        "configured": True,
        "jobs": jobs,
        "error": "",
        "help": "",
    }


def list_builds(job_name):
    if not job_name or not JOB_PATTERN.match(job_name):
        return {
            "configured": is_configured(),
            "job": job_name,
            "builds": [],
            "error": "Invalid Jenkins job name. Use a simple job name without folders.",
            "help": "",
        }

    tree = (
        "builds[number,result,timestamp,duration,url,displayName,building]"
        "{0,25}"
    )
    result = _request(
        "GET",
        f"/job/{quote(job_name, safe='')}/api/json",
        params={"tree": tree},
    )

    if not result["ok"]:
        return {
            "configured": True,
            "job": job_name,
            "builds": [],
            "error": result.get("error", "Could not load Jenkins builds."),
            "help": "",
        }

    return {
        "configured": True,
        "job": job_name,
        "builds": (result["data"] or {}).get("builds", []),
        "error": "",
        "help": "",
    }


def get_build(job_name, build_number):
    if not job_name or not JOB_PATTERN.match(job_name):
        return {
            "configured": is_configured(),
            "build": None,
            "error": "Invalid Jenkins job name.",
        }

    result = _request(
        "GET",
        f"/job/{quote(job_name, safe='')}/{int(build_number)}/api/json",
        params={
            "tree": (
                "number,result,timestamp,duration,url,displayName,"
                "building,description,actions[parameters[name,value]]"
            )
        },
    )

    if not result["ok"]:
        return {
            "configured": True,
            "build": None,
            "error": result.get("error", "Could not load the Jenkins build."),
        }

    build = result["data"]
    if isinstance(build, dict) and build.get("url"):
        build["url"] = _safe_url(build["url"])

    return {
        "configured": True,
        "build": build,
        "error": "",
    }


def get_console(job_name, build_number, max_chars=200000):
    if not job_name or not JOB_PATTERN.match(job_name):
        return {
            "configured": is_configured(),
            "console": "",
            "error": "Invalid Jenkins job name.",
        }

    result = _request(
        "GET",
        f"/job/{quote(job_name, safe='')}/{int(build_number)}/consoleText",
        timeout=30,
    )

    if not result["ok"]:
        return {
            "configured": True,
            "console": "",
            "error": result.get("error", "Could not load the Jenkins console."),
        }

    return {
        "configured": True,
        "console": _safe(result["text"][-max_chars:]),
        "error": "",
    }


def trigger_build(job_name):
    config = _config()

    if not config["url"]:
        return {
            "success": False,
            "configured": False,
            "error": "Jenkins is not configured.",
            "help": ENV_HELP,
        }

    if not job_name or not JOB_PATTERN.match(job_name):
        return {
            "success": False,
            "configured": True,
            "error": "Invalid Jenkins job name. Use a simple job name without folders.",
        }

    headers = {}
    crumb = _request("GET", "/crumbIssuer/api/json", timeout=10)
    if crumb["ok"] and isinstance(crumb["data"], dict):
        crumb_field = crumb["data"].get("crumbRequestField")
        crumb_value = crumb["data"].get("crumb")
        if crumb_field and crumb_value:
            headers[crumb_field] = crumb_value

    if headers:
        result = _request_with_headers(
            "POST",
            f"/job/{quote(job_name, safe='')}/build",
            headers=headers,
        )
    else:
        result = _request(
            "POST",
            f"/job/{quote(job_name, safe='')}/build",
        )

    if not result["ok"]:
        return {
            "success": False,
            "configured": True,
            "error": result.get("error", "Jenkins rejected the build request."),
        }

    return {
        "success": True,
        "configured": True,
        "job": job_name,
        "queue_url": _safe_url(result.get("location", "")),
        "message": f"Jenkins build queued for {job_name}.",
    }


def _request_with_headers(method, path, *, headers, timeout=20):
    config = _config()

    try:
        response = requests.request(
            method,
            f"{config['url']}{path}",
            auth=_auth(config),
            verify=config["verify_ssl"],
            timeout=timeout,
            headers={"Accept": "application/json", **headers},
        )
    except requests.exceptions.RequestException as exc:
        return {
            "ok": False,
            "configured": True,
            "status_code": None,
            "data": None,
            "text": "",
            "error": _safe(str(exc)),
            "location": "",
        }

    return {
        "ok": response.ok,
        "configured": True,
        "status_code": response.status_code,
        "data": None,
        "text": response.text or "",
        "error": "" if response.ok else _safe((response.text or "")[:1000]),
        "location": response.headers.get("Location", ""),
    }
