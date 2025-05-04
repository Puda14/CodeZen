"use client";

import { useState, useEffect } from "react";
import api from "@/utils/coreApi";
import {
  FiLoader,
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiClock,
} from "react-icons/fi";
import MonacoCodeViewer from "@/components/MonacoCodeViewer";

const UserSubmissions = ({ contestId }) => {
  const [submissionsData, setSubmissionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedProblems, setExpandedProblems] = useState({});
  const [expandedSubmissions, setExpandedSubmissions] = useState({});

  useEffect(() => {
    if (!contestId) {
      setError("Contest ID is missing.");
      setLoading(false);
      return;
    }

    const fetchSubmissions = async () => {
      setLoading(true);
      setError(null);
      setSubmissionsData(null);
      setExpandedProblems({});
      setExpandedSubmissions({});
      try {
        const res = await api.get(`/submission/user?contest=${contestId}`);
        const data = res.data;
        setSubmissionsData(data);

        const firstProblemWithSubmissions = data?.problems?.find(
          (p) => p.submissions?.length > 0
        );
        if (firstProblemWithSubmissions) {
          setExpandedProblems({
            [firstProblemWithSubmissions.problem._id]: true,
          });
        } else if (data?.problems?.length > 0) {
          setExpandedProblems({ [data.problems[0].problem._id]: true });
        }
      } catch (err) {
        console.error("Failed to fetch user submissions:", err);
        setError(err.response?.data?.message || "Failed to load submissions.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [contestId]);

  const toggleProblemExpansion = (problemId) => {
    setExpandedProblems((prev) => ({
      ...prev,
      [problemId]: !prev[problemId],
    }));
    if (expandedProblems[problemId]) {
      setExpandedSubmissions((prev) => {
        const next = { ...prev };
        submissionsData?.problems
          ?.find((p) => p.problem._id === problemId)
          ?.submissions?.forEach((s) => {
            delete next[s._id];
          });
        return next;
      });
    }
  };

  const toggleSubmissionExpansion = (submissionId) => {
    setExpandedSubmissions((prev) => ({
      ...prev,
      [submissionId]: !prev[submissionId],
    }));
  };

  const getOverallSubmissionStatus = (submission) => {
    if (!submission || !submission.testcaseResults) {
      return {
        status: "Processing",
        Icon: FiClock,
        colorClass: "text-gray-500 dark:text-gray-400",
      };
    }

    const results = submission.testcaseResults;
    const totalTestCases = results.length;

    if (totalTestCases === 0 && submission.score !== undefined) {
      return {
        status: "Pending Results",
        Icon: FiClock,
        colorClass: "text-gray-500 dark:text-gray-400",
      };
    }
    if (totalTestCases === 0 && submission.score === undefined) {
      return {
        status: "Processing",
        Icon: FiClock,
        colorClass: "text-gray-500 dark:text-gray-400",
      };
    }

    let hasCompileError = false;
    let hasRuntimeError = false;
    let hasTimeLimit = false;
    let hasWrongAnswer = false;
    let allPassed = true;

    for (const result of results) {
      const status = result.status?.toLowerCase() || "";
      if (status.includes("compilation error")) {
        hasCompileError = true;
        allPassed = false;
        break;
      }
      if (status.includes("runtime error")) {
        hasRuntimeError = true;
        allPassed = false;
      }
      if (status.includes("time limit exceeded")) {
        hasTimeLimit = true;
        allPassed = false;
      }
      if (status.includes("failed") || status.includes("wrong answer")) {
        hasWrongAnswer = true;
        allPassed = false;
      } else if (!(status === "passed" || status === "accepted")) {
        allPassed = false;
      }
    }

    if (hasCompileError)
      return {
        status: "Compilation Error",
        Icon: FiAlertCircle,
        colorClass: "text-orange-500 dark:text-orange-400",
      };
    if (hasRuntimeError)
      return {
        status: "Runtime Error",
        Icon: FiAlertCircle,
        colorClass: "text-purple-500 dark:text-purple-400",
      };
    if (hasTimeLimit)
      return {
        status: "Time Limit Exceeded",
        Icon: FiAlertCircle,
        colorClass: "text-yellow-500 dark:text-yellow-400",
      };

    if (allPassed && totalTestCases > 0)
      return {
        status: "Accepted",
        Icon: FiCheckCircle,
        colorClass: "text-green-500 dark:text-green-400",
      };
    if (submission.score > 0 && !allPassed)
      return {
        status: "Partial Score",
        Icon: FiAlertCircle,
        colorClass: "text-blue-500 dark:text-blue-400",
      };
    if (hasWrongAnswer || (!allPassed && submission.score === 0))
      return {
        status: "Wrong Answer",
        Icon: FiXCircle,
        colorClass: "text-red-500 dark:text-red-400",
      };

    return {
      status: "Processing",
      Icon: FiClock,
      colorClass: "text-gray-500 dark:text-gray-400",
    };
  };

  const getTestCaseStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "passed":
      case "accepted":
        return "text-green-500 dark:text-green-400";
      case "failed":
      case "wrong answer":
        return "text-red-500 dark:text-red-400";
      case "runtime error":
        return "text-purple-500 dark:text-purple-400";
      case "time limit exceeded":
        return "text-yellow-500 dark:text-yellow-400";
      case "compilation error":
        return "text-orange-500 dark:text-orange-400";
      default:
        return "text-gray-500 dark:text-gray-400";
    }
  };

  const formatExecutionTime = (timeInSeconds) => {
    if (typeof timeInSeconds !== "number" || timeInSeconds < 0) {
      return "-";
    }
    if (timeInSeconds < 1) {
      return `${(timeInSeconds * 1000).toFixed(0)} ms`;
    }
    return `${timeInSeconds.toFixed(3)} s`;
  };

  if (loading)
    return (
      <div className="flex justify-center items-center py-10 text-gray-700 dark:text-gray-300">
        <FiLoader className="animate-spin text-3xl text-blue-500" />
        <span className="ml-3">Loading your submissions...</span>
      </div>
    );
  if (error)
    return (
      <div className="flex flex-col items-center justify-center py-10 text-red-600 dark:text-red-400 px-4">
        <FiAlertTriangle className="text-4xl mb-3" />
        <p className="text-center">{error}</p>
      </div>
    );
  if (
    !submissionsData ||
    !submissionsData.problems ||
    submissionsData.problems.length === 0
  )
    return (
      <p className="text-center py-10 text-gray-600 dark:text-gray-400">
        No problems found in this contest.
      </p>
    );

  const hasAnySubmissions = submissionsData.problems.some(
    (p) => p.submissions?.length > 0
  );
  if (!hasAnySubmissions)
    return (
      <p className="text-center py-10 text-gray-600 dark:text-gray-400">
        You haven't made any submissions yet.
      </p>
    );

  return (
    <div className="space-y-5">
      {submissionsData.problems.map((problemData) => {
        if (!problemData.submissions || problemData.submissions.length === 0)
          return null;

        const problemId = problemData.problem._id;
        const isProblemExpanded = !!expandedProblems[problemId];

        return (
          <section
            key={problemId}
            aria-labelledby={`problem-title-${problemId}`}
            className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
            <h2>
              <button
                id={`problem-title-${problemId}`}
                onClick={() => toggleProblemExpansion(problemId)}
                aria-expanded={isProblemExpanded}
                className="w-full flex justify-between items-center p-4 text-left bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                <span className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mr-2">
                  Problem: {problemData.problem.name}
                </span>
                <div className="flex items-center gap-x-3">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                    {problemData.submissions.length} submission
                    {problemData.submissions.length !== 1 ? "s" : ""}
                  </span>
                  {isProblemExpanded ? (
                    <FiChevronUp
                      aria-hidden="true"
                      className="text-gray-600 dark:text-gray-400 text-xl flex-shrink-0"
                    />
                  ) : (
                    <FiChevronDown
                      aria-hidden="true"
                      className="text-gray-600 dark:text-gray-400 text-xl flex-shrink-0"
                    />
                  )}
                </div>
              </button>
            </h2>

            {isProblemExpanded && (
              <div className="border-t border-gray-200 dark:border-gray-600 divide-y divide-gray-200 dark:divide-gray-600">
                {[...problemData.submissions]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((submission) => {
                    const submissionId = submission._id;
                    const isSubmissionExpanded =
                      !!expandedSubmissions[submissionId];
                    const {
                      status: overallStatus,
                      Icon: StatusIcon,
                      colorClass: statusColor,
                    } = getOverallSubmissionStatus(submission);

                    return (
                      <div
                        key={submissionId}
                        className="bg-white dark:bg-gray-800 transition-colors duration-150 ease-in-out"
                      >
                        <button
                          onClick={() =>
                            toggleSubmissionExpansion(submissionId)
                          }
                          aria-expanded={isSubmissionExpanded}
                          aria-controls={`submission-details-${submissionId}`}
                          className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/40 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-400 rounded-md"
                        >
                          <div className="flex items-center gap-3 mb-2 sm:mb-0 flex-grow min-w-0">
                            <StatusIcon
                              aria-hidden="true"
                              className={`text-2xl ${statusColor} flex-shrink-0`}
                            />
                            <div className="min-w-0">
                              <span
                                className={`block font-semibold ${statusColor} text-base truncate`}
                              >
                                {overallStatus}
                              </span>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                Attempt #{submission.attemptNumber} &middot;
                                Score: {submission.score ?? "N/A"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 text-sm w-full sm:w-auto flex-shrink-0">
                            <span className="text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs font-mono whitespace-nowrap">
                              {submission.language}
                            </span>
                            <time
                              dateTime={submission.createdAt}
                              className="text-gray-500 dark:text-gray-400 whitespace-nowrap"
                            >
                              {new Date(submission.createdAt).toLocaleString(
                                [],
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </time>
                            {isSubmissionExpanded ? (
                              <FiChevronUp
                                aria-hidden="true"
                                className="text-gray-500 dark:text-gray-400 text-lg hidden sm:block"
                              />
                            ) : (
                              <FiChevronDown
                                aria-hidden="true"
                                className="text-gray-500 dark:text-gray-400 text-lg hidden sm:block"
                              />
                            )}
                          </div>
                        </button>

                        {isSubmissionExpanded && (
                          <div
                            id={`submission-details-${submissionId}`}
                            className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30"
                          >
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-1.5 text-sm text-gray-700 dark:text-gray-300">
                                  Code:
                                </h4>
                                <MonacoCodeViewer
                                  language={submission.language}
                                  value={submission.code}
                                  height="250px"
                                />
                              </div>
                              <div>
                                <h4 className="font-semibold mb-1.5 text-sm text-gray-700 dark:text-gray-300">
                                  Test Case Results:
                                </h4>
                                {submission.testcaseResults &&
                                submission.testcaseResults.length > 0 ? (
                                  <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded-md">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600 text-sm">
                                      <thead className="bg-gray-100 dark:bg-gray-700/50">
                                        <tr>
                                          <th
                                            scope="col"
                                            className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 tracking-wider"
                                          >
                                            Test Case
                                          </th>
                                          <th
                                            scope="col"
                                            className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300 tracking-wider"
                                          >
                                            Status
                                          </th>
                                          <th
                                            scope="col"
                                            className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300 tracking-wider"
                                          >
                                            Score
                                          </th>
                                          <th
                                            scope="col"
                                            className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300 tracking-wider"
                                          >
                                            Time
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {submission.testcaseResults.map(
                                          (result) => (
                                            <tr
                                              key={
                                                result._id || result.test_case
                                              }
                                            >
                                              <td className="px-3 py-2 whitespace-nowrap font-mono text-gray-800 dark:text-gray-200">
                                                {result.test_case}
                                              </td>
                                              <td
                                                className={`px-3 py-2 whitespace-nowrap text-right font-medium ${getTestCaseStatusColor(
                                                  result.status
                                                )}`}
                                              >
                                                {result.status}
                                              </td>
                                              <td className="px-3 py-2 whitespace-nowrap text-right text-gray-600 dark:text-gray-300">
                                                {result.score ?? "-"}
                                              </td>
                                              <td className="px-3 py-2 whitespace-nowrap text-right text-gray-500 dark:text-gray-400 text-xs">
                                                {formatExecutionTime(
                                                  result.execution_time
                                                )}
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-gray-500 dark:text-gray-400 italic text-sm px-3 py-2">
                                    No test case results available or pending.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default UserSubmissions;
