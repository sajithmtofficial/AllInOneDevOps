import { api, setAuthTokens, clearAuthTokens } from "./api";

export async function loginUser(username, password) {
  const data = await api.post("/login/", { username, password });

  setAuthTokens({ access: data.access, refresh: data.refresh });
  localStorage.setItem("username", username);

  return data;
}

export async function registerUser(username, email, password) {
  return api.post("/register/", { username, email, password });
}

export async function requestPasswordReset(email) {
  return api.post("/password-reset/", { email });
}

export async function confirmPasswordReset(uid, token, password) {
  return api.post("/password-reset/confirm/", { uid, token, password });
}

export function getCurrentUser() {
  return api.get("/me/");
}

export function logoutUser() {
  clearAuthTokens();
}

export function getCurrentUsername() {
  return localStorage.getItem("username") || "";
}

export function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded;
  } catch {
    return null;
  }
}
