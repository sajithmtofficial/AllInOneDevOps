const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  ""
);

const ACCESS_KEY = "access";
const REFRESH_KEY = "refresh";

function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setAuthTokens({ access, refresh }) {
  if (access) {
    localStorage.setItem(ACCESS_KEY, access);
  }
  if (refresh) {
    localStorage.setItem(REFRESH_KEY, refresh);
  }
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem("username");
  window.dispatchEvent(new Event("auth-expired"));
}

export function hasAccessToken() {
  return Boolean(getAccessToken());
}

async function rawRequest(path, { method = "GET", body, headers = {}, signal, token } = {}) {
  const finalHeaders = {
    Accept: "application/json",
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  return { response, data };
}

function buildError(response, data) {
  const message =
    (data && typeof data === "object" && !Array.isArray(data)
      ? data.detail || data.error || data.reply || null
      : null) ||
    (typeof data === "string" && data) ||
    `Request failed with status ${response.status}`;

  const error = new Error(message);
  error.status = response.status;
  error.data = data;
  return error;
}

let refreshPromise = null;

async function refreshAccessToken() {
  const refresh = getRefreshToken();

  if (!refresh) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { response, data } = await rawRequest("/token/refresh/", {
        method: "POST",
        body: { refresh },
      });

      if (!response.ok || !data?.access) {
        return null;
      }

      setAuthTokens({ access: data.access });
      return data.access;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function request(path, options = {}) {
  const token = getAccessToken();
  const { response, data } = await rawRequest(path, {
    ...options,
    token,
  });

  if (response.ok) {
    return data;
  }

  const retriable =
    response.status === 401 && token && !path.startsWith("/login");

  if (retriable) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      const retry = await rawRequest(path, { ...options, token: newToken });

      if (retry.response.ok) {
        return retry.data;
      }

      throw buildError(retry.response, retry.data);
    }

    clearAuthTokens();
    throw buildError(response, data);
  }

  throw buildError(response, data);
}

export const api = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) =>
    request(path, { ...options, method: "POST", body }),
  put: (path, body, options) =>
    request(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) =>
    request(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};

export { API_BASE };
