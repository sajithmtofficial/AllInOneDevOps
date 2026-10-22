import { api } from "./api";

export function getProjectFiles(projectId) {
  return api.get(`/projects/${projectId}/files/`);
}

export function saveProjectFiles(projectId, files) {
  return api.post(`/projects/${projectId}/files/save/`, {
    files: files.map((file) => ({
      name: file.name,
      content: file.content,
    })),
  });
}
