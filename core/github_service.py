
import base64
import requests
from urllib.parse import urlparse, quote

GITHUB_API = "https://api.github.com"


def parse_repo_url(repo_url):
    if not repo_url:
        return None

    parsed = urlparse(repo_url.strip())

    if parsed.netloc.lower() not in ("github.com", "www.github.com"):
        return None

    parts = parsed.path.strip("/").split("/")

    if len(parts) < 2 or not parts[0] or not parts[1]:
        return None

    owner = parts[0]
    repository = parts[1].removesuffix(".git")

    return owner, repository


def github_request(url, params=None):
    response = requests.get(
        url,
        params=params,
        headers={"Accept": "application/vnd.github+json"},
        timeout=20,
    )
    response.raise_for_status()
    return response.json()


def get_repo_info(repo_url):
    try:
        repo = parse_repo_url(repo_url)

        if not repo:
            return None

        owner, repository = repo

        return github_request(
            f"{GITHUB_API}/repos/{owner}/{repository}"
        )

    except (requests.RequestException, ValueError) as error:
        print("GitHub Service Error:", error)
        return None


def get_repo_files(repo_url):
    try:
        repo = parse_repo_url(repo_url)

        if not repo:
            return None

        owner, repository = repo
        info = get_repo_info(repo_url)

        if not info:
            return None

        branch = info.get("default_branch", "main")

        tree_url = (
            f"{GITHUB_API}/repos/{owner}/{repository}"
            f"/git/trees/{quote(branch, safe='')}"
        )

        tree = github_request(tree_url, {"recursive": "1"})

        return {
            "repository": info.get("full_name"),
            "branch": branch,
            "files": [
                {
                    "path": item["path"],
                    "type": item["type"],
                }
                for item in tree.get("tree", [])
                if item.get("type") == "blob"
            ],
            "truncated": tree.get("truncated", False),
        }

    except (requests.RequestException, ValueError) as error:
        print("GitHub Files Error:", error)
        return None


def get_file_content(repo_url, file_path, branch=None):
    try:
        repo = parse_repo_url(repo_url)

        if not repo or not file_path:
            return None

        owner, repository = repo
        info = get_repo_info(repo_url)

        if not info:
            return None

        branch = branch or info.get("default_branch", "main")
        encoded_path = quote(file_path, safe="/")

        data = github_request(
            f"{GITHUB_API}/repos/{owner}/{repository}"
            f"/contents/{encoded_path}",
            {"ref": branch},
        )

        if data.get("type") != "file" or "content" not in data:
            return None

        content = base64.b64decode(data["content"])

        return content.decode("utf-8", errors="replace")

    except (
        requests.RequestException,
        ValueError,
        KeyError,
    ) as error:
        print("GitHub File Content Error:", error)
        return None
