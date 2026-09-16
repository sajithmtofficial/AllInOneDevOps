import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

export const getGithubInfo = async (repoUrl) => {
  const response = await axios.get(`${API_URL}/github-info/`, {
    params: {
      repo: repoUrl,
    },
  });

  return response.data;
};