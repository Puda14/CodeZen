import axios from "axios";
import Cookies from "js-cookie";

const coreApi = axios.create({
  baseURL: "http://localhost:8080/api/core",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

coreApi.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers["x-access-token"] = token;
  }
  return config;
});

export default coreApi;
