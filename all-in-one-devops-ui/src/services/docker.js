import { api } from "./api";

export function getDockerStatus() {
  return api.get("/docker/status/");
}

export function getDockerImages() {
  return api.get("/docker/images/");
}

export function getDockerContainers() {
  return api.get("/docker/containers/");
}

export function inspectContainer(name) {
  return api.get(`/docker/containers/${encodeURIComponent(name)}/`);
}

export function getContainerLogs(name) {
  return api.get(`/docker/containers/${encodeURIComponent(name)}/logs/`);
}

export function startContainer(name) {
  return api.post(`/docker/containers/${encodeURIComponent(name)}/start/`);
}

export function stopContainer(name) {
  return api.post(`/docker/containers/${encodeURIComponent(name)}/stop/`);
}

export function removeContainer(name) {
  return api.post(`/docker/containers/${encodeURIComponent(name)}/remove/`);
}

export function removeImage(image) {
  return api.post(`/docker/images/${encodeURIComponent(image)}/remove/`);
}
