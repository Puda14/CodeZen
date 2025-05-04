"use client";

import { useState, useEffect, useMemo } from "react";
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
  FiUser,
  FiFilter,
  FiPackage,
} from "react-icons/fi";
import MonacoCodeViewer from "@/components/MonacoCodeViewer";

const getOverallSubmissionStatus = (submission) => {
  if (!submission || !submission.testcaseResults)
    return {
      status: "Processing",
      Icon: FiClock,
      colorClass: "text-gray-500 dark:text-gray-400",
    };
  const results = submission.testcaseResults;
  const totalTestCases = results.length;
  if (totalTestCases === 0 && submission.score !== undefined)
    return {
      status: "Pending Results",
      Icon: FiClock,
      colorClass: "text-gray-500 dark:text-gray-400",
    };
  if (totalTestCases === 0 && submission.score === undefined)
    return {
      status: "Processing",
      Icon: FiClock,
      colorClass: "text-gray-500 dark:text-gray-400",
    };
  let hasCompileError = false,
    hasRuntimeError = false,
    hasTimeLimit = false,
    hasWrongAnswer = false,
    allPassed = true;
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
  if (typeof timeInSeconds !== "number" || timeInSeconds < 0) return "-";
  if (timeInSeconds < 1) return `${(timeInSeconds * 1000).toFixed(0)} ms`;
  return `${timeInSeconds.toFixed(3)} s`;
};

const OwnerSubmissionsList = ({ contestId }) => {
  const [allSubmissionsData, setAllSubmissionsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterUsername, setFilterUsername] = useState("");
  const [filterProblemName, setFilterProblemName] = useState("");

  const [expandedUsers, setExpandedUsers] = useState({});
  const [expandedProblems, setExpandedProblems] = useState({});
  const [expandedSubmissions, setExpandedSubmissions] = useState({});

  useEffect(() => {
    if (!contestId) {
      setError("Contest ID is missing.");
      setLoading(false);
      return;
    }
    const fetchOwnerSubmissions = async () => {
      setLoading(true);
      setError(null);
      setAllSubmissionsData([]);
      setExpandedUsers({});
      setExpandedProblems({});
      setExpandedSubmissions({});
      try {
        const res = await api.get(`/submission/owner?contest=${contestId}`);
        setAllSubmissionsData(res.data || []);
      } catch (err) {
        console.error("Failed to fetch owner submissions:", err);
        setError(err.response?.data?.message || "Failed to load submissions.");
      } finally {
        setLoading(false);
      }
    };
    fetchOwnerSubmissions();
  }, [contestId]);

  const toggleExpansion = (type, id) => {
    switch (type) {
      case "user":
        setExpandedUsers((prev) => ({ ...prev, [id]: !prev[id] }));
        break;
      case "problem":
        setExpandedProblems((prev) => ({ ...prev, [id]: !prev[id] }));
        break;
      case "submission":
        setExpandedSubmissions((prev) => ({ ...prev, [id]: !prev[id] }));
        break;
      default:
        break;
    }
  };

  // --- Filtering ---
  const filteredData = useMemo(() => {
    let filtered = allSubmissionsData;

    if (filterUsername) {
      const lowerCaseUserFilter = filterUsername.toLowerCase();
      filtered = filtered.filter(
        (userData) =>
          userData.user.username.toLowerCase().includes(lowerCaseUserFilter) ||
          userData.user.email.toLowerCase().includes(lowerCaseUserFilter)
      );
    }

    if (filterProblemName) {
      const lowerCaseProblemFilter = filterProblemName.toLowerCase();
      filtered = filtered
        .map((userData) => ({
          ...userData,
          problems: userData.problems.filter(
            (problemData) =>
              problemData.problem.name
                .toLowerCase()
                .includes(lowerCaseProblemFilter) &&
              problemData.submissions.length > 0
          ),
        }))
        .filter((userData) => userData.problems.length > 0);
    } else {
      filtered = filtered
        .map((userData) => ({
          ...userData,
          problems: userData.problems.filter(
            (problemData) => problemData.submissions.length > 0
          ),
        }))
        .filter((userData) => userData.problems.length > 0);
    }

    return filtered;
  }, [allSubmissionsData, filterUsername, filterProblemName]);

  if (loading)
    return (
      <div className="flex justify-center items-center py-10 text-gray-700 dark:text-gray-300">
        <FiLoader className="animate-spin text-3xl text-blue-500" />
        <span className="ml-3">Loading submissions...</span>
      </div>
    );
  if (error)
    return (
      <div className="flex flex-col items-center justify-center py-10 text-red-600 dark:text-red-400 px-4">
        <FiAlertTriangle className="text-4xl mb-3" />
        <p className="text-center">{error}</p>
      </div>
    );

  const noDataAfterLoad =
    !allSubmissionsData || allSubmissionsData.length === 0;
  if (noDataAfterLoad && !loading)
    return (
      <p className="text-center py-10 text-gray-600 dark:text-gray-400">
        No submissions found for this contest yet.
      </p>
    );

  return (
    <div className="space-y-6">
      {/* Filter Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/30">
        <div>
          <label
            htmlFor="filter-user"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            <FiUser className="inline mr-1 h-4 w-4" /> Filter by User
            (Username/Email):
          </label>
          <input
            type="text"
            id="filter-user"
            value={filterUsername}
            onChange={(e) => setFilterUsername(e.target.value)}
            placeholder="e.g., testuser or test@example.com"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="filter-problem"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            <FiPackage className="inline mr-1 h-4 w-4" /> Filter by Problem
            Name:
          </label>
          <input
            type="text"
            id="filter-problem"
            value={filterProblemName}
            onChange={(e) => setFilterProblemName(e.target.value)}
            placeholder="e.g., P011 or Addition"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200 text-sm"
          />
        </div>
      </div>

      {filteredData.length === 0 && (filterUsername || filterProblemName) && (
        <p className="text-center py-6 text-gray-500 dark:text-gray-400">
          No submissions match your filters.
        </p>
      )}

      {/* Level 1: Users */}
      {filteredData.map((userData) => {
        const userId = userData.user._id;
        const isUserExpanded = !!expandedUsers[userId];
        const totalUserSubmissionsCount = userData.problems.reduce(
          (sum, p) => sum + p.submissions.length,
          0
        );
        if (totalUserSubmissionsCount === 0) return null;

        return (
          <section
            key={userId}
            aria-labelledby={`user-title-${userId}`}
            className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
          >
            {/* User Header */}
            <h2>
              <button
                onClick={() => toggleExpansion("user", userId)}
                aria-expanded={isUserExpanded}
                className="w-full flex justify-between items-center p-4 text-left bg-gray-100 dark:bg-gray-700/70 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-t-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                <div className="flex items-center gap-3 mr-2 min-w-0">
                  <FiUser className="text-xl text-gray-600 dark:text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 block truncate">
                      {userData.user.username}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block truncate">
                      {userData.user.email}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-x-3">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                    {totalUserSubmissionsCount} submission
                    {totalUserSubmissionsCount !== 1 ? "s" : ""}
                  </span>
                  {isUserExpanded ? (
                    <FiChevronUp className="text-gray-600 dark:text-gray-400 text-xl flex-shrink-0" />
                  ) : (
                    <FiChevronDown className="text-gray-600 dark:text-gray-400 text-xl flex-shrink-0" />
                  )}
                </div>
              </button>
            </h2>

            {/* Level 2: Problems */}
            {isUserExpanded && (
              <div className="border-t border-gray-200 dark:border-gray-600 p-3 md:p-4 space-y-3 bg-gray-50 dark:bg-gray-800/50">
                {userData.problems.map((problemData) => {
                  if (problemData.submissions.length === 0) return null;

                  const problemContextId = `${userId}-${problemData.problem._id}`;
                  const isProblemExpanded =
                    !!expandedProblems[problemContextId];

                  return (
                    <div
                      key={problemContextId}
                      className="border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-inner"
                    >
                      {/* Problem Header */}
                      <h3>
                        <button
                          onClick={() =>
                            toggleExpansion("problem", problemContextId)
                          }
                          aria-expanded={isProblemExpanded}
                          className="w-full flex justify-between items-center p-3 text-left bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700/80 rounded-t-md transition duration-150 ease-in-out focus:outline-none focus:ring-1 focus:ring-blue-400 focus:ring-inset"
                        >
                          <div className="flex items-center gap-2 mr-2 min-w-0">
                            <FiPackage className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                            <span className="font-semibold text-sm text-gray-700 dark:text-gray-200 truncate">
                              {problemData.problem.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-x-2">
                            <span className="text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                              {problemData.submissions.length} attempt
                              {problemData.submissions.length !== 1 ? "s" : ""}
                            </span>
                            {isProblemExpanded ? (
                              <FiChevronUp className="text-gray-500 dark:text-gray-400 text-base flex-shrink-0" />
                            ) : (
                              <FiChevronDown className="text-gray-500 dark:text-gray-400 text-base flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      </h3>

                      {/* Level 3: Submissions */}
                      {isProblemExpanded && (
                        <div className="border-t border-gray-200 dark:border-gray-600 divide-y divide-gray-200 dark:divide-gray-700">
                          {[...problemData.submissions]
                            .sort(
                              (a, b) =>
                                new Date(b.createdAt) - new Date(a.createdAt)
                            )
                            .map((submission) => {
                              const submissionId = submission._id;
                              const isSubmissionDetailExpanded =
                                !!expandedSubmissions[submissionId];
                              const {
                                status: overallStatus,
                                Icon: StatusIcon,
                                colorClass: statusColor,
                              } = getOverallSubmissionStatus(submission);

                              return (
                                <div
                                  key={submissionId}
                                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150"
                                >
                                  {/* Submission Summary Row */}
                                  <button
                                    onClick={() =>
                                      toggleExpansion(
                                        "submission",
                                        submissionId
                                      )
                                    }
                                    aria-expanded={isSubmissionDetailExpanded}
                                    aria-controls={`details-${submissionId}`}
                                    className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center p-2.5 text-left focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-300"
                                  >
                                    <div className="flex items-center gap-2.5 mb-1.5 sm:mb-0 flex-grow min-w-0">
                                      <StatusIcon
                                        aria-hidden="true"
                                        className={`text-lg ${statusColor} flex-shrink-0`}
                                      />
                                      <div className="min-w-0">
                                        <span
                                          className={`block font-medium ${statusColor} text-xs md:text-sm truncate`}
                                        >
                                          {overallStatus}
                                        </span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          Attempt #{submission.attemptNumber}{" "}
                                          &middot; Score:{" "}
                                          {submission.score ?? "N/A"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 text-xs w-full sm:w-auto flex-shrink-0">
                                      <span className="text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono whitespace-nowrap">
                                        {submission.language}
                                      </span>
                                      <time
                                        dateTime={submission.createdAt}
                                        className="text-gray-500 dark:text-gray-400 whitespace-nowrap"
                                      >
                                        {new Date(
                                          submission.createdAt
                                        ).toLocaleString([], {
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "2-digit",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </time>
                                      {isSubmissionDetailExpanded ? (
                                        <FiChevronUp className="text-gray-500 dark:text-gray-400 text-sm flex-shrink-0" />
                                      ) : (
                                        <FiChevronDown className="text-gray-500 dark:text-gray-400 text-sm flex-shrink-0" />
                                      )}
                                    </div>
                                  </button>

                                  {/* Submission Details (Code & Test Cases) */}
                                  {isSubmissionDetailExpanded && (
                                    <div
                                      id={`details-${submissionId}`}
                                      className="p-3 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/30 space-y-3"
                                    >
                                      <div>
                                        <h5 className="font-semibold mb-1 text-xs text-gray-600 dark:text-gray-400">
                                          Code:
                                        </h5>
                                        <MonacoCodeViewer
                                          language={submission.language}
                                          value={submission.code}
                                          height="200px"
                                        />
                                      </div>
                                      <div>
                                        <h5 className="font-semibold mb-1 text-xs text-gray-600 dark:text-gray-400">
                                          Test Cases:
                                        </h5>
                                        {submission.testcaseResults &&
                                        submission.testcaseResults.length >
                                          0 ? (
                                          <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded-md">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600 text-xs">
                                              <thead className="bg-gray-100 dark:bg-gray-700/50">
                                                <tr>
                                                  <th
                                                    scope="col"
                                                    className="px-2 py-1 text-left font-medium text-gray-500 dark:text-gray-300"
                                                  >
                                                    Test Case
                                                  </th>
                                                  <th
                                                    scope="col"
                                                    className="px-2 py-1 text-right font-medium text-gray-500 dark:text-gray-300"
                                                  >
                                                    Status
                                                  </th>
                                                  <th
                                                    scope="col"
                                                    className="px-2 py-1 text-right font-medium text-gray-500 dark:text-gray-300"
                                                  >
                                                    Score
                                                  </th>
                                                  <th
                                                    scope="col"
                                                    className="px-2 py-1 text-right font-medium text-gray-500 dark:text-gray-300"
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
                                                        result._id ||
                                                        result.test_case
                                                      }
                                                    >
                                                      <td className="px-2 py-1 whitespace-nowrap font-mono text-gray-700 dark:text-gray-200">
                                                        {result.test_case}
                                                      </td>
                                                      <td
                                                        className={`px-2 py-1 whitespace-nowrap text-right font-medium ${getTestCaseStatusColor(
                                                          result.status
                                                        )}`}
                                                      >
                                                        {result.status}
                                                      </td>
                                                      <td className="px-2 py-1 whitespace-nowrap text-right text-gray-600 dark:text-gray-300">
                                                        {result.score ?? "-"}
                                                      </td>
                                                      <td className="px-2 py-1 whitespace-nowrap text-right text-gray-500 dark:text-gray-400">
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
                                          <p className="text-gray-500 dark:text-gray-400 italic text-xs px-2 py-1">
                                            No test case results.
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {userData.problems.filter((p) => p.submissions.length > 0)
                  .length === 0 && (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-3">
                    No submissions found for this user{" "}
                    {filterProblemName
                      ? `matching problem filter "${filterProblemName}"`
                      : ""}
                    .
                  </p>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default OwnerSubmissionsList;
