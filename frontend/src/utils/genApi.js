import Cookies from "js-cookie";
import axios from "axios";

const GEN_API_BASE_URL = "http://localhost:8080/api";

export const generateTestcasesStream = async (
  payload,
  onData,
  onError,
  onComplete
) => {
  try {
    const token = Cookies.get("token");
    const response = await fetch(`${GEN_API_BASE_URL}/gen/testcases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token || "",
      },
      body: JSON.stringify(payload),
    });
    console.log("Response:", response);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = {
          message: response.statusText || "Unknown error from server",
        };
      }
      throw new Error(
        errorData.message || `API request failed with status ${response.status}`
      );
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (buffer.trim().length > 0) {
          try {
            const jsonObject = JSON.parse(buffer.trim());
            if (onData) onData(jsonObject);
          } catch (e) {
            if (onError)
              onError(new Error("Error parsing final JSON from stream."));
          }
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
        const line = buffer.substring(0, newlineIndex).trim();
        buffer = buffer.substring(newlineIndex + 1);
        if (line) {
          try {
            const jsonObject = JSON.parse(line);
            if (onData) onData(jsonObject);
          } catch (e) {
            console.warn(
              "Error parsing JSON object from stream line:",
              e,
              "Line:",
              line
            );
          }
        }
      }
    }
    if (onComplete) onComplete();
  } catch (error) {
    if (onError) onError(error);
  }
};

export const executeGeneratedTestcases = async (payload) => {
  try {
    const response = await genApi.post("/testcases/execute", payload);
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to execute testcases.";
    throw new Error(errorMessage);
  }
};

const genApi = axios.create({
  baseURL: `${GEN_API_BASE_URL}/gen`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

genApi.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers["x-access-token"] = token;
  }
  return config;
});

export default genApi;
