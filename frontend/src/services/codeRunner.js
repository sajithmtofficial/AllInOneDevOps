import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";


export const runCode = async ({
    language,
    code,
    stdin = "",
}) => {

    const response = await axios.post(
        `${API_URL}/run/`,
        {
            language,
            code,
            stdin,
        }
    );

    return response.data;
};