import { api } from "./api";

export async function executeCode({ language, code, stdin = "" }) {
  try {
    return await api.post("/execute/", { language, code, stdin });
  } catch (error) {
    if (error.data && typeof error.data === "object") {
      return {
        success: false,
        language,
        stdout: error.data.stdout || "",
        stderr:
          error.data.stderr ||
          error.data.error ||
          error.message ||
          "Code execution failed.",
        returncode: error.data.returncode ?? 1,
      };
    }

    return {
      success: false,
      language,
      stdout: "",
      stderr:
        error.message ||
        "Could not connect to the Django server. Make sure the backend is running.",
      returncode: 1,
    };
  }
}

export async function stopExecution() {
  try {
    return await api.post("/stop-execution/", {});
  } catch (error) {
    return {
      success: false,
      error: error.message || "Could not stop the running execution.",
    };
  }
}
