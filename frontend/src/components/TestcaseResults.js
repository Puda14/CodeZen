import React from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

const getStatusColor = (status = "") => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes("accept") || lowerStatus.includes("pass"))
    return "text-green-600 dark:text-green-400";
  if (lowerStatus.includes("wrong") || lowerStatus.includes("fail"))
    return "text-red-600 dark:text-red-400";
  if (lowerStatus.includes("error") || lowerStatus.includes("exception"))
    return "text-red-600 dark:text-red-400";
  if (lowerStatus.includes("limit"))
    return "text-yellow-600 dark:text-yellow-400";
  if (
    lowerStatus.includes("pending") ||
    lowerStatus.includes("running") ||
    lowerStatus.includes("processing") ||
    lowerStatus.includes("submitted")
  )
    return "text-blue-600 dark:text-blue-400";
  return "text-gray-600 dark:text-gray-400";
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
    return null;
  }

  if (submissionResult.status === "Error") {
    return (
      <div className="mt-0">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
          Submission Error
        </h3>
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md border border-red-300 dark:border-red-700">
          <p className="text-sm text-red-700 dark:text-red-300">
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

  const overallStatus =
    submissionResult.status ||
    (summary
      ? summary.failed === 0 && summary.passed > 0
        ? "Accepted"
        : summary.passed > 0
        ? "Partial"
        : summary.total > 0
        ? "Failed"
        : "Processing"
      : "Processing");

  if (evaluationResults.length === 0 && !summary) {
    return (
      <div className="mt-0">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Submission Result
        </h3>
        <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md border border-gray-300 dark:border-gray-700">
          <p className={`text-sm font-medium ${getStatusColor(overallStatus)}`}>
            Status: {overallStatus}
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
      <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md border border-gray-300 dark:border-gray-700">
        {evaluationResults.length > 0 && (
          <ul className="space-y-3">
            {evaluationResults.map((testResult, index) => {
              const originalTest = originalTestcases[index];
              const isPublicTest = originalTest?.isPublic === true;

              const status = testResult.status || "Unknown";
              const score = testResult.score;
              const userOutput = testResult.output;
              const errorMessage = testResult.error_message;
              const testCaseName = testResult.test_case || `Case ${index + 1}`;
              const executionTime = testResult.execution_time;

              const lowerStatus = status.toLowerCase();
              const isPassed =
                lowerStatus.includes("pass") || lowerStatus.includes("accept");
              const isError =
                lowerStatus.includes("error") ||
                lowerStatus.includes("exception");

              const input = isPublicTest ? originalTest?.input : undefined;
              const expectedOutput = isPublicTest
                ? originalTest?.output
                : undefined;

              const formatTime = (time) => {
                if (typeof time === "number" && time >= 0) {
                  return `${time.toFixed(3)}s`;
                }
                return null;
              };
              const formattedTime = formatTime(executionTime);

              return (
                <li key={testCaseName}>
                  {isPublicTest && originalTest ? (
                    <details className="group border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-2">
                      <summary
                        className={`flex justify-between items-center cursor-pointer py-1 rounded ${getStatusColor(
                          status
                        )}`}
                      >
                        <div className="flex items-center">
                          <FiChevronRight
                            className="group-open:hidden mr-1 flex-shrink-0"
                            size={16}
                          />
                          <FiChevronDown
                            className="hidden group-open:block mr-1 flex-shrink-0"
                            size={16}
                          />
                          <span className="text-sm">
                            {testCaseName}:{" "}
                            <span className="font-medium">{status}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 ml-auto text-xs font-mono text-gray-500 dark:text-gray-400">
                          {formattedTime && <span>({formattedTime})</span>}
                          {score !== undefined && <span>[{score} pts]</span>}
                        </div>
                      </summary>
                      <div className="pl-6 pr-2 py-2 border-l-2 border-gray-300 dark:border-gray-600 ml-2 mt-1 text-gray-700 dark:text-gray-300">
                        {formattedTime && (
                          <p className="text-xs mb-2">
                            <span className="font-semibold text-gray-600 dark:text-gray-400">
                              Execution Time:
                            </span>{" "}
                            <span className="font-mono">{formattedTime}</span>
                          </p>
                        )}

                        {isPassed ? (
                          <>
                            <CodeBlock label="Input" content={input} />
                            <CodeBlock
                              label="Output"
                              content={expectedOutput}
                            />
                          </>
                        ) : isError ? (
                          <>
                            <CodeBlock label="Input" content={input} />
                            <CodeBlock
                              label="Your Output"
                              content={userOutput}
                            />
                            <CodeBlock
                              label="Error Message"
                              content={errorMessage}
                            />
                          </>
                        ) : (
                          <>
                            <CodeBlock label="Input" content={input} />
                            <CodeBlock
                              label="Expected Output"
                              content={expectedOutput}
                            />
                            <CodeBlock
                              label="Your Output"
                              content={userOutput}
                            />
                            {errorMessage && (
                              <CodeBlock
                                label="Details"
                                content={errorMessage}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </details>
                  ) : (
                    <div
                      className={`text-sm flex justify-between items-center p-2 rounded ${getStatusColor(
                        status
                      )}`}
                    >
                      <span>
                        {testCaseName}:{" "}
                        <span className="font-medium">{status}</span>
                      </span>
                      <div className="flex items-center gap-2 ml-auto text-xs font-mono text-gray-500 dark:text-gray-400">
                        {formattedTime && <span>({formattedTime})</span>}
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
              overallStatus
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
