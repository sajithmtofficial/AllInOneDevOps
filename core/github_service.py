import requests

def get_repo_info(repo_url):
    try:
        repo = repo_url.replace("https://github.com/", "")

        api = f"https://api.github.com/repos/{repo}"

        response = requests.get(api)

        if response.status_code == 200:
            return response.json()

        return None

    except Exception:
        return None