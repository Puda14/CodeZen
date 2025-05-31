"use client";

import React, { useState } from "react";
import {
  FiPlay,
  FiDownload,
  FiZap,
  FiLoader,
  FiAlertCircle,
} from "react-icons/fi";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useToast } from "@/context/ToastProvider";
import { executeGeneratedTestcases } from "@/utils/genApi";

const ExecutionWorkflow = ({
  generatedTestcases,
  solutionCode,
  selectedProcessor,
  isParentGenerating,
}) => {
  const { showToast } = useToast();

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState([]);
  const [executionError, setExecutionError] = useState(null);
  const [isDownloadingExecuted, setIsDownloadingExecuted] = useState(false);

  const handleExecuteTestcases = async () => {
    if (generatedTestcases.length === 0) {
      showToast(
        "No C++ codes (input generators) available to execute.",
        "warning"
      );
      return;
    }
    if (!solutionCode || !solutionCode.trim() || !selectedProcessor) {
      showToast(
        "Solution code and processor are required for execution.",
        "error"
      );
      return;
    }

    setIsExecuting(true);
    setExecutionError(null);
    setExecutionResults([]);

    const genInputCodes = generatedTestcases.map((tc) => tc.input);

    try {
      const payload = {
        gen_input_code: genInputCodes,
        solution_code: solutionCode,
        processor: selectedProcessor,
      };
      const results = await executeGeneratedTestcases(payload);
      setExecutionResults(results);
      if (results && results.length > 0) {
        showToast(
          `Successfully executed ${results.length} test cases.`,
          "success"
        );
      } else {
        showToast("Execution completed, but no results were returned.", "info");
      }
    } catch (error) {
      const msg =
        error.message || "An error occurred while executing test cases.";
      setExecutionError(msg);
      showToast(msg, "error");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDownloadExecutedTestcasesZip = async () => {
    if (executionResults.length === 0) {
      showToast("No execution results available to download.", "warning");
      return;
    }

    setIsDownloadingExecuted(true);
    const zip = new JSZip();

    executionResults.forEach((result, index) => {
      const folderName = String(index).padStart(2, "0");
      const actualInputContent = result.input || "";
      let actualOutputContent = result.output || "";

      if (result.error || actualOutputContent === "<<error>>") {
        actualOutputContent = "<<error>>";
      }

      zip.folder(folderName).file("input.txt", actualInputContent);
      zip.folder(folderName).file("output.txt", actualOutputContent);
    });

    try {
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "testcases.zip");
      showToast("testcases.zip downloaded successfully!", "success");
    } catch (error) {
      showToast("Failed to download testcases.zip. Check console.", "error");
    } finally {
      setIsDownloadingExecuted(false);
    }
  };

  if (generatedTestcases.length === 0 || isParentGenerating) {
    return null;
  }

  return (
    <div className="mt-6 pt-6 border-t dark:border-gray-700">
      <div className="text-center mb-6">
        <button
          onClick={handleExecuteTestcases}
          disabled={isExecuting || isParentGenerating}
          className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg inline-flex items-center shadow-md transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <FiZap className="mr-2 h-5 w-5" />
          {isExecuting
            ? "Executing Test Cases..."
            : "Generate & Execute Test Cases"}
        </button>
      </div>

      {isExecuting && (
        <div className="flex justify-center items-center py-6">
          <FiLoader className="animate-spin text-purple-500 dark:text-purple-400 text-3xl" />
          <span className="ml-3 text-lg text-gray-600 dark:text-gray-300">
            Executing test cases, please wait...
          </span>
        </div>
      )}

      {executionError && !isExecuting && (
        <div className="my-4 p-4 bg-red-50 dark:bg-red-800/20 text-red-700 dark:text-red-300 rounded-md text-sm flex items-center shadow border border-red-200 dark:border-red-700">
          <FiAlertCircle className="mr-2 flex-shrink-0 h-5 w-5" />
          <div>
            <p className="font-semibold">Execution Error:</p>
            <p>{executionError}</p>
          </div>
        </div>
      )}

      {executionResults.length > 0 && !isExecuting && (
        <div className="mt-8">
          <div className="p-4 md:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <FiPlay /> Final Test Case I/O ({executionResults.length})
              </h2>
              <button
                onClick={handleDownloadExecutedTestcasesZip}
                disabled={isDownloadingExecuted}
                className="w-full sm:w-auto text-sm px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md inline-flex items-center justify-center shadow transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload className="mr-1.5 h-4 w-4" />
                {isDownloadingExecuted
                  ? "Downloading..."
                  : "Download testcases.zip (I/O)"}
              </button>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 border-l-2 border-teal-300 dark:border-teal-700 pl-3 py-1">
              {executionResults.map((result, index) => (
                <div
                  key={`exec-res-${index}`}
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/40 shadow-sm"
                >
                  <p className="font-medium text-sm mb-1 text-gray-800 dark:text-gray-100">
                    Test Case #{index + 1}
                  </p>
                  <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-2">
                    Input:
                  </h5>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-900/60 dark:text-gray-300 p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-40">
                    {result.input || "<Empty Input>"}
                  </pre>
                  <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-2">
                    Output:
                  </h5>
                  <pre
                    className={`text-xs p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-40 ${
                      result.error || result.output === "<<error>>"
                        ? "bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300"
                        : "bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300"
                    }`}
                  >
                    {result.error
                      ? `<<error>> ${
                          result.error.length < 100 ? `(${result.error})` : ""
                        }`
                      : result.output || "<No Output>"}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionWorkflow;
