"use client";

import React from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

const getStatusColor = (status = "") => {
  const s = status?.toLowerCase();

  switch (s) {
    case "passed":
    case "accepted":
      return "text-green-600 dark:text-green-400";
    case "failed":
      return "text-red-600 dark:text-red-400";
    case "compile_error":
      return "text-orange-500 dark:text-orange-400";
    case "runtime_error":
      return "text-purple-500 dark:text-purple-400";
    case "tle":
      return "text-yellow-600 dark:text-yellow-400";
    case "mle":
      return "text-indigo-500 dark:text-indigo-400";
    case "segmentation_fault":
      return "text-pink-500 dark:text-pink-400";
    case "error":
      return "text-red-700 dark:text-red-500";
    case "pending":
    case "running":
    case "processing":
    case "submitted":
      return "text-blue-600 dark:text-blue-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
};

const CodeBlock = ({ content, label }) => (
  <div className="mt-2">
    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
      {label}:
    </p>
    <pre className="text-xs bg-gray-200 dark:bg-gray-700 p-2 rounded overflow-x-auto font-mono text-gray-800 dark:text-gray-200 max-h-40 whitespace-pre-wrap break-words">
      {content === "" ? "<Empty>" : content ?? "N/A"}
    </pre>
  </div>
);

export default function TestcaseResults({
  submissionResult,
  originalTestcases = [],
}) {
  if (!submissionResult || typeof submissionResult !== "object") {
    return (
      <div className="text-sm text-gray-500 italic">
        No submission result data available.
      </div>
    );
  }

  if (
    submissionResult.status === "Error" ||
    submissionResult.status?.toLowerCase().includes("error")
  ) {
    const errorColor = getStatusColor(submissionResult.status);
    return (
      <div className="mt-0">
        <h3 className={`text-lg font-semibold ${errorColor} mb-2`}>
          Submission Error
        </h3>
        <div
          className={`p-4 rounded-md border ${errorColor
            .replace("text-", "border-")
            .replace("-600", "-300")
            .replace("-400", "-700")} bg-${
            errorColor.split("-")[1]
          }-50 dark:bg-${errorColor.split("-")[1]}-900/30`}
        >
          <p className={`text-sm ${errorColor}`}>
            {submissionResult.message ||
              "An unknown error occurred during submission processing."}
          </p>
        </div>
      </div>
    );
  }

  const evaluationResults = Array.isArray(submissionResult.results)
    ? submissionResult.results
    : [];

  const summary =
    typeof submissionResult.summary === "object" &&
    submissionResult.summary !== null
      ? submissionResult.summary
      : null;

  const overallStatusFromSummary = summary
    ? summary.failed === 0 && summary.passed > 0
      ? "Accepted"
      : summary.passed > 0
      ? "Partial"
      : summary.total > 0
      ? "Failed"
      : "Processing"
    : "Processing";

  if (evaluationResults.length === 0 && !summary) {
    return (
      <div className="mt-0">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Submission Result
        </h3>
        <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md border border-gray-300 dark:border-gray-700">
          <p className={`text-sm font-medium ${getStatusColor("processing")}`}>
            Status: Processing or No Testcases Executed
            {submissionResult.message ? ` - ${submissionResult.message}` : ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-0">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
        Testcase Results
      </h3>
      <div className="bg-gray-100 dark:bg-gray-900 p-3 md:p-4 rounded-md border border-gray-300 dark:border-gray-700">
        {evaluationResults.length > 0 && (
          <ul className="space-y-3">
            {evaluationResults.map((testResult, index) => {
              const originalTest =
                originalTestcases?.find(
                  (ot) =>
                    ot.test_case === testResult.test_case ||
                    ot.name === testResult.test_case
                ) || originalTestcases?.[index];
              const isPublicTest = originalTest?.isPublic === true;

              const status = testResult.status || "Unknown";
              const score = testResult.score;
              const userOutput = testResult.output;
              const errorMessage = testResult.error_message;
              const exitCode = testResult.exit_code;
              const testCaseName = testResult.test_case || `Case ${index + 1}`;
              const executionTime = testResult.execution_time;

              const lowerStatus = status.toLowerCase();
              const isPassed =
                lowerStatus === "passed" || lowerStatus === "accepted";
              const isError =
                [
                  "compile_error",
                  "runtime_error",
                  "tle",
                  "mle",
                  "segmentation_fault",
                  "error",
                ].includes(lowerStatus) ||
                (exitCode !== undefined && exitCode !== 0);

              const input = isPublicTest ? originalTest?.input : undefined;
              const expectedOutput = isPublicTest
                ? originalTest?.output
                : undefined;

              const formatTime = (time) => {
                if (typeof time === "number" && time >= 0) {
                  if (time < 1) return `${(time * 1000).toFixed(0)}ms`;
                  return `${time.toFixed(3)}s`;
                }
                return null;
              };
              const formattedTime = formatTime(executionTime);

              const statusColorClass = getStatusColor(status);

              return (
                <li key={testCaseName || index}>
                  {isPublicTest ? (
                    <details className="group border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-2">
                      <summary
                        className={`flex justify-between items-center cursor-pointer py-1.5 rounded list-none ${statusColorClass}`}
                      >
                        {" "}
                        <div className="flex items-center">
                          <span className="inline-block w-4 mr-1">
                            {" "}
                            <FiChevronRight
                              className="group-open:hidden"
                              size={16}
                            />
                            <FiChevronDown
                              className="hidden group-open:block"
                              size={16}
                            />
                          </span>
                          <span className="text-sm">
                            {testCaseName}:{" "}
                            <span className="font-medium">{status}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 ml-auto text-xs font-mono text-gray-500 dark:text-gray-400 pl-2">
                          {formattedTime && <span>({formattedTime})</span>}
                          {exitCode !== undefined && (
                            <span>[EC: {exitCode}]</span>
                          )}{" "}
                          {score !== undefined && <span>[{score} pts]</span>}
                        </div>
                      </summary>
                      <div className="pl-6 pr-2 py-2 border-l-2 border-gray-300 dark:border-gray-600 ml-2 mt-1 text-gray-700 dark:text-gray-300">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
                          {formattedTime && (
                            <div>
                              <span className="font-semibold text-gray-600 dark:text-gray-400">
                                Time:
                              </span>{" "}
                              <span className="font-mono">{formattedTime}</span>
                            </div>
                          )}
                          {exitCode !== undefined && (
                            <div>
                              <span className="font-semibold text-gray-600 dark:text-gray-400">
                                Exit Code:
                              </span>{" "}
                              <span className="font-mono">{exitCode}</span>
                            </div>
                          )}
                        </div>

                        <CodeBlock label="Input" content={input} />
                        {!isPassed && expectedOutput !== undefined && (
                          <CodeBlock
                            label="Expected Output"
                            content={expectedOutput}
                          />
                        )}
                        <CodeBlock label="Your Output" content={userOutput} />
                        {errorMessage && (
                          <CodeBlock
                            label="Error Message"
                            content={errorMessage}
                          />
                        )}
                        {isPassed &&
                          expectedOutput !== undefined &&
                          userOutput !== expectedOutput && (
                            <CodeBlock
                              label="Expected Output"
                              content={expectedOutput}
                            />
                          )}
                      </div>
                    </details>
                  ) : (
                    <div
                      className={`text-sm flex justify-between items-center p-2 rounded ${statusColorClass}`}
                    >
                      <span>
                        {testCaseName}:{" "}
                        <span className="font-medium">{status}</span>
                      </span>
                      <div className="flex items-center gap-2 ml-auto text-xs font-mono text-gray-500 dark:text-gray-400">
                        {formattedTime && <span>({formattedTime})</span>}
                        {exitCode !== undefined && (
                          <span>[EC: {exitCode}]</span>
                        )}{" "}
                        {score !== undefined && <span>[{score} pts]</span>}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {summary && (
          <p
            className={`mt-4 pt-3 border-t border-gray-300 dark:border-gray-700 text-sm font-medium ${getStatusColor(
              overallStatusFromSummary
            )}`}
          >
            Summary: {summary.passed ?? "?"} Passed / {summary.failed ?? "?"}{" "}
            Failed / {summary.total ?? "?"} Total
            {summary.total_score !== undefined && (
              <span className="ml-2 font-semibold">
                | Total Score: {summary.total_score}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
