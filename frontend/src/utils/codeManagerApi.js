import axios from "axios";
import Cookies from "js-cookie";

const codeManagerApi = axios.create({
  baseURL: "http://localhost:8080/api/code-manager",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

codeManagerApi.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers["x-access-token"] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default codeManagerApi;
