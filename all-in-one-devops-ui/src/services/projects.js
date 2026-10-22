import { api } from "./api";

function normalizeProjects(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

export async function getProjects(signal) {
  return normalizeProjects(await api.get("/projects/", { signal }));
}

export function createProject(project) {
  return api.post("/projects/", project);
}

export function updateProject(id, project) {
  return api.patch(`/projects/${id}/`, project);
}

export function deleteProject(id) {
  return api.delete(`/projects/${id}/`);
}

export function getProjectShare(id) {
  return api.get(`/projects/${id}/share/`);
}

export function createProjectShare(id, rotate = false) {
  return api.post(`/projects/${id}/share/`, { rotate });
}

export function revokeProjectShare(id) {
  return api.delete(`/projects/${id}/share/`);
}

export function getProjectSharePreview(token) {
  return api.get(`/projects/share/${token}/`);
}

export function joinProjectShare(token) {
  return api.post(`/projects/share/${token}/join/`, {});
}

export function leaveProject(id) {
  return api.post(`/projects/${id}/leave/`, {});
}

export function removeProjectMember(id, userId) {
  return api.delete(`/projects/${id}/members/${userId}/`);
}
