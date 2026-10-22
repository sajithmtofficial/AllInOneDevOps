import { api } from "./api";

function buildQuery(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function getHistory(filters = {}) {
  return api.get(`/history/${buildQuery(filters)}`);
}

export function getProjectActivity(projectId, filters = {}) {
  return api.get(`/projects/${projectId}/activity/${buildQuery(filters)}`);
}

export function getRecentActivity(limit = 6) {
  return api.get(`/activity/recent/${buildQuery({ limit })}`);
}

export function getHistoryEntry(entryId) {
  return api.get(`/history/${entryId}/`);
}

export function restoreHistoryEntry(entryId, confirm = true) {
  return api.post(`/history/${entryId}/restore/`, { confirm });
}
