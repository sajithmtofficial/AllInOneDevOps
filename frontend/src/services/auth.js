import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

export const loginUser = async (username, password) => {
  const response = await axios.post(`${API_URL}/login/`, {
    username,
    password,
  });

  return response.data;
};

export const registerUser = async (username, email, password) => {
  const response = await axios.post(`${API_URL}/register/`, {
    username,
    email,
    password,
  });

  return response.data;
};