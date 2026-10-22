import { api } from "./api";

const LAST_JOB_KEY = "lastPipelineJob";

export async function runPipeline({
  repoUrl,
  branch = "main",
  buildDocker = true,
  deploy = true,
  projectId = null,
  engine = "auto",
  jenkinsJob = "",
}) {
  try {
    const data = await api.post("/pipeline/run/", {
      repo_url: repoUrl,
      branch,
      build_docker: buildDocker,
      deploy,
      project_id: projectId,
      engine,
      jenkins_job: jenkinsJob,
    });

    if (data?.job) {
      saveLastJobId(data.job.id);
    }

    return data;
  } catch (error) {
    // The backend returns non-2xx when a stage fails but still includes the
    // complete job object with stage logs.
    if (error.data?.job) {
      saveLastJobId(error.data.job.id);
      return {
        success: false,
        job: error.data.job,
        run: error.data.run,
        error: error.data.job.error || error.data.error || error.message,
      };
    }

    throw error;
  }
}

export function getPipelineStatus(jobId) {
  return api.get(`/pipeline/status/${encodeURIComponent(jobId)}/`);
}

export function getPipelineConfig() {
  return api.get("/pipeline/config/");
}

export function getPipelineRuns(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return api.get(`/pipeline/runs/${query ? `?${query}` : ""}`);
}

export function saveLastJobId(jobId) {
  localStorage.setItem(LAST_JOB_KEY, jobId);
}

export function getLastJobId() {
  return localStorage.getItem(LAST_JOB_KEY) || "";
}
