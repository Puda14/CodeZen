import { useState } from "react";
import axios from "axios";

const useCodeExecution = () => {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("");
  const [inputData, setInputData] = useState("");
  const [output, setOutput] = useState("");
  const [testcaseResults, setTestcaseResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Base URL
  const api = axios.create({
    baseURL: "http://localhost:8080/api/code-manager",
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Execute code
  const handleExecute = async () => {
    const payload = { processor: language, code, input_data: inputData };

    try {
      const response = await api.post("/execute", payload);
      setOutput(
        response.data.result.output ||
          response.data.result.error_message ||
          "Execution successful but no result returned."
      );
    } catch (error) {
      console.error("Execution failed:", error);
      setOutput(
        error.response?.data?.message ||
          "Error executing code. Check your input or server connection."
      );
    }
  };

  // Check test cases
  const handleCheckTestcase = async () => {
    setIsLoading(true);
    const payload = { processor: language, code, input_data: inputData };

    try {
      const response = await api.post("/testcase", payload);
      setTestcaseResults(response.data.result);
    } catch (error) {
      console.error("Testcase check failed:", error);
      setTestcaseResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    language,
    setLanguage,
    code,
    setCode,
    inputData,
    setInputData,
    output,
    handleExecute,
    handleCheckTestcase,
    testcaseResults,
    isLoading,
  };
};

export default useCodeExecution;
