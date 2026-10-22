import { api } from "./api";

export function getJenkinsStatus() {
  return api.get("/jenkins/status/");
}

export function getJenkinsJobs() {
  return api.get("/jenkins/jobs/");
}

export function getJenkinsBuilds(jobName) {
  return api.get(`/jenkins/jobs/${encodeURIComponent(jobName)}/builds/`);
}

export function getJenkinsBuild(jobName, buildNumber) {
  return api.get(
    `/jenkins/jobs/${encodeURIComponent(jobName)}/builds/${buildNumber}/`
  );
}

export function getJenkinsConsole(jobName, buildNumber) {
  return api.get(
    `/jenkins/jobs/${encodeURIComponent(jobName)}/builds/${buildNumber}/console/`
  );
}

export function triggerJenkinsBuild(jobName) {
  return api.post(`/jenkins/jobs/${encodeURIComponent(jobName)}/build/`);
}
