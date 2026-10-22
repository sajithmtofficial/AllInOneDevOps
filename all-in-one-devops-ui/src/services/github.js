import { api } from "./api";

function withRepo(path, repoUrl, extra = {}) {
  const params = new URLSearchParams({ repo: repoUrl, ...extra });
  return api.get(`${path}?${params.toString()}`);
}

export function getGithubInfo(repoUrl) {
  return withRepo("/github-info/", repoUrl);
}

export function getGithubFiles(repoUrl) {
  return withRepo("/github-files/", repoUrl);
}

export function getGithubFileContent(repoUrl, filePath, branch) {
  const params = new URLSearchParams({ repo: repoUrl, path: filePath });

  if (branch) {
    params.set("branch", branch);
  }

  return api.get(`/github-file-content/?${params.toString()}`);
}
