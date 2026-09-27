import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

/**
 * Run code using the Django backend.
 *
 * The backend executes the code inside Docker,
 * so the user does NOT need Python, Node.js, Java,
 * GCC, etc. installed on their own computer.
 */
export const runCode = async ({
  language,
  code,
  stdin = "",
}) => {
  try {
    const response = await axios.post(
      `${API_URL}/execute/`,
      {
        language,
        code,
        stdin,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Code execution error:", error);

    // Backend responded with an error
    if (error.response) {
      return {
        success: false,
        language,
        stdout: "",
        stderr:
          error.response.data?.stderr ||
          error.response.data?.error ||
          "Code execution failed.",
        returncode: error.response.data?.returncode ?? 1,
      };
    }

    // Server is not running / connection failed
    if (error.request) {
      return {
        success: false,
        language,
        stdout: "",
        stderr:
          "Could not connect to the Django server.\n" +
          "Make sure the backend is running with:\n" +
          "python manage.py runserver",
        returncode: 1,
      };
    }

    // Other unexpected error
    return {
      success: false,
      language,
      stdout: "",
      stderr: error.message || "Unknown execution error.",
      returncode: 1,
    };
  }
};

/**
 * Stop currently running code.
 */
export const stopCode = async () => {
  try {
    const response = await axios.post(
      `${API_URL}/stop-code/`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Stop code error:", error);

    return {
      success: false,
      error:
        error.response?.data?.error ||
        "Could not stop the running code.",
    };
  }
};

/**
 * Check whether the backend/Docker execution service is available.
 */
export const checkRunnerHealth = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/ai-health/`,
      {
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Runner health check error:", error);

    return {
      success: false,
      error: "Backend is not reachable.",
    };
  }
};

export default runCode;