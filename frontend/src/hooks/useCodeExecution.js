import { useState } from "react";
import codeManagerApi from "@/utils/codeManagerApi";
import { useToast } from "@/context/ToastProvider";
import { supportedProcessors } from "@/config/processorConfig";

const useCodeExecution = (contestId = null, problemId = null) => {
  const [selectedKey, setSelectedKey] = useState("CPP14");
  const [code, setCode] = useState("");
  const [inputData, setInputData] = useState("");
  const [output, setOutput] = useState("");
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isLoadingRun, setIsLoadingRun] = useState(false);
  const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
  const { showToast } = useToast();

  const processor = supportedProcessors[selectedKey].processor;

  const handleExecute = async () => {
    const payload = { processor, code, input_data: inputData };
    setIsLoadingRun(true);
    setOutput("Executing...");
    setSubmissionResult(null);
    try {
      const response = await codeManagerApi.post("/execute", payload);
      if (response.data?.result?.status === "success") {
        setOutput(
          response.data.result.output ?? "Execution successful, no output."
        );
      } else if (response.data?.result?.error_message) {
        setOutput(`Error:\n${response.data.result.error_message}`);
      } else {
        setOutput(
          `Execution Status: ${response.data?.result?.status || "Unknown"}\n${
            response.data?.result?.output ||
            response.data?.result?.error_message ||
            ""
          }`
        );
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Error executing code.";
      setOutput(`Execution Failed:\n${errorMsg}`);
      showToast(errorMsg, "error");
    } finally {
      setIsLoadingRun(false);
    }
  };

  const handleContestSubmit = async () => {
    if (!contestId || !problemId) {
      showToast("Cannot submit: Contest or Problem ID missing.", "error");
      return;
    }
    const payload = {
      processor,
      code,
      contestId,
      problemId,
    };
    setIsLoadingSubmit(true);
    setSubmissionResult(null);
    setOutput("");
    showToast("Submitting your solution...", "info");
    try {
      const response = await codeManagerApi.post("/evaluate", payload);
      if (response.data?.result) {
        setSubmissionResult(response.data.result);
        const summary = response.data.result.summary;
        if (
          summary &&
          summary.failed === 0 &&
          summary.passed === summary.total &&
          summary.total > 0
        ) {
          showToast(
            `Accepted! Score: ${summary.total_score ?? "N/A"}`,
            "success"
          );
        } else if (summary) {
          showToast(
            `Submission evaluated: ${summary.passed ?? 0}/${
              summary.total ?? 0
            } passed. Score: ${summary.total_score ?? "N/A"}`,
            "warning"
          );
        } else {
          showToast(response.data.message || "Submission processed.", "info");
        }
      } else {
        console.warn(
          "Invalid response structure from evaluation API:",
          response.data
        );
        throw new Error(
          response.data?.message ||
            "Received an unexpected response from evaluation service."
        );
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Submission failed.";
      setSubmissionResult({
        status: "Error",
        message: errorMsg,
        results: [],
        summary: { passed: 0, failed: 0, total: 0, total_score: 0 },
      });
      showToast(errorMsg, "error");
    } finally {
      setIsLoadingSubmit(false);
    }
  };

  return {
    selectedKey,
    setSelectedKey,
    code,
    setCode,
    inputData,
    setInputData,
    output,
    handleExecute,
    submissionResult,
    handleContestSubmit,
    isLoadingRun,
    isLoadingSubmit,
  };
};

export default useCodeExecution;
