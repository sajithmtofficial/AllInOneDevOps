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
