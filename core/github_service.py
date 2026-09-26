import requests
from urllib.parse import urlparse


def get_repo_info(repo_url):
    try:
        if not repo_url:
            return None

        # Clean spaces
        repo_url = repo_url.strip()

        # Parse GitHub URL
        parsed = urlparse(repo_url)

        # Make sure it is a GitHub URL
        if parsed.netloc.lower() not in ["github.com", "www.github.com"]:
            return None

        # Get path and remove leading/trailing /
        repo = parsed.path.strip("/")

        # Remove .git if present
        if repo.endswith(".git"):
            repo = repo[:-4]

        # Repository must contain owner/repository
        parts = repo.split("/")

        if len(parts) < 2:
            return None

        owner = parts[0]
        repository = parts[1]

        # GitHub API URL
        api = f"https://api.github.com/repos/{owner}/{repository}"

        response = requests.get(
            api,
            headers={
                "Accept": "application/vnd.github+json"
            },
            timeout=10
        )

        if response.status_code == 200:
            return response.json()

        print("GitHub API Error:", response.status_code)
        print(response.text)

        return None

    except Exception as e:
        print("GitHub Service Error:", e)
        return None