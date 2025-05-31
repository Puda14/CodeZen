"use client";

import React, { useState, useEffect, useMemo } from "react";
import api from "@/utils/coreApi";
import {
  FiLoader,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiClock,
  FiUsers,
  FiFileText,
  FiActivity,
  FiPieChart,
} from "react-icons/fi";

import OverallStatCard from "./analysis/OverallStatCard";
import LanguageDistributionChart from "./analysis/LanguageDistributionChart";
import StatusDistributionChart from "./analysis/StatusDistributionChart";
import ProblemAnalyticsCard from "./analysis/ProblemAnalyticsCard";

const getOverallSubmissionStatus = (submission) => {
  if (
    !submission ||
    !submission.testcaseResults ||
    submission.testcaseResults.length === 0
  ) {
    if (submission && submission.score !== undefined && submission.score > 0) {
      return {
        status: "Graded",
        Icon: FiCheckCircle,
        colorClass: "text-green-500 dark:text-green-400",
        submissionErrorMessage: null,
        showGlobalErrorMessage: false,
      };
    }
    return {
      status: "No Test Cases / Pending",
      Icon: FiClock,
      colorClass: "text-gray-500 dark:text-gray-400",
      submissionErrorMessage: null,
      showGlobalErrorMessage: false,
    };
  }
  const results = submission.testcaseResults;
  let firstErrorStatus = null;
  let firstErrorMessage = null;
  let allShareSameCriticalErrorAndZeroScore = true;
  const criticalErrorStatuses = [
    "compile_error",
    "runtime_error",
    "tle",
    "mle",
    "segmentation_fault",
    "error",
  ];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const tcStatus = result.status?.toLowerCase();
    if (result.score !== 0) {
      allShareSameCriticalErrorAndZeroScore = false;
    }
    if (!criticalErrorStatuses.includes(tcStatus)) {
      allShareSameCriticalErrorAndZeroScore = false;
      if (
        tcStatus === "passed" ||
        tcStatus === "accepted" ||
        tcStatus === "failed"
      ) {
      }
    }
    if (i === 0 && criticalErrorStatuses.includes(tcStatus)) {
      firstErrorStatus = tcStatus;
      firstErrorMessage = result.error_message;
    } else if (
      criticalErrorStatuses.includes(tcStatus) &&
      tcStatus !== firstErrorStatus
    ) {
      allShareSameCriticalErrorAndZeroScore = false;
    } else if (
      !criticalErrorStatuses.includes(tcStatus) &&
      firstErrorStatus !== null
    ) {
      allShareSameCriticalErrorAndZeroScore = false;
    }
    if (i === 0 && !criticalErrorStatuses.includes(tcStatus)) {
      allShareSameCriticalErrorAndZeroScore = false;
    }
  }
  if (
    allShareSameCriticalErrorAndZeroScore &&
    !criticalErrorStatuses.includes(firstErrorStatus)
  ) {
    allShareSameCriticalErrorAndZeroScore = false;
  }
  const showGlobalError = allShareSameCriticalErrorAndZeroScore;
  let finalSubmissionErrorMessage = showGlobalError ? firstErrorMessage : null;
  let finalStatus = "";
  let finalIcon = FiClock;
  let finalColorClass = "text-gray-500 dark:text-gray-400";
  if (showGlobalError) {
    switch (firstErrorStatus) {
      case "compile_error":
        finalStatus = "Compilation Error";
        finalIcon = FiAlertCircle;
        finalColorClass = "text-orange-500 dark:text-orange-400";
        break;
      case "runtime_error":
        finalStatus = "Runtime Error";
        finalIcon = FiAlertCircle;
        finalColorClass = "text-purple-500 dark:text-purple-400";
        break;
      case "tle":
        finalStatus = "Time Limit Exceeded";
        finalIcon = FiAlertCircle;
        finalColorClass = "text-yellow-500 dark:text-yellow-400";
        break;
      case "mle":
        finalStatus = "Memory Limit Exceeded";
        finalIcon = FiAlertCircle;
        finalColorClass = "text-indigo-500 dark:text-indigo-400";
        break;
      case "segmentation_fault":
        finalStatus = "Segmentation Fault";
        finalIcon = FiAlertCircle;
        finalColorClass = "text-pink-500 dark:text-pink-400";
        break;
      case "error":
        finalStatus = "Error";
        finalIcon = FiAlertCircle;
        finalColorClass = "text-red-600 dark:text-red-500";
        break;
      default:
        finalStatus = "Processing";
        finalIcon = FiClock;
        finalColorClass = "text-gray-500 dark:text-gray-400";
        finalSubmissionErrorMessage = null;
        showGlobalError = false;
        break;
    }
  } else {
    let allPassed = true;
    let hasAnyFailure = false;
    for (const result of results) {
      const tcStatus = result.status?.toLowerCase() || "";
      if (!(tcStatus === "passed" || tcStatus === "accepted")) {
        allPassed = false;
        if (tcStatus === "failed") {
          hasAnyFailure = true;
        }
      }
    }
    if (allPassed) {
      finalStatus = "Accepted";
      finalIcon = FiCheckCircle;
      finalColorClass = "text-green-500 dark:text-green-400";
    } else if (submission.score > 0) {
      finalStatus = "Partial Score";
      finalIcon = FiAlertCircle;
      finalColorClass = "text-blue-500 dark:text-blue-400";
    } else if (hasAnyFailure || (!allPassed && submission.score === 0)) {
      finalStatus = "Wrong Answer";
      finalIcon = FiXCircle;
      finalColorClass = "text-red-500 dark:text-red-400";
    } else {
      finalStatus = "Evaluation Issue";
      finalIcon = FiAlertTriangle;
      finalColorClass = "text-yellow-500 dark:text-yellow-400";
    }
  }
  return {
    status: finalStatus,
    Icon: finalIcon,
    colorClass: finalColorClass,
    submissionErrorMessage: finalSubmissionErrorMessage,
    showGlobalErrorMessage: showGlobalError,
  };
};

const ContestAnalyticsTab = ({ contestId }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const processAnalytics = useMemo(() => {
    return (allUserSubmissions, contestProblems) => {
      const analytics = {
        overall: {
          usersWithSubmissions: new Set(),
          totalSubmissions: 0,
          processorCounts: {},
          overallStatusCounts: {},
        },
        problems: {},
      };
      const problemDetailsMap = new Map();
      if (contestProblems && Array.isArray(contestProblems)) {
        contestProblems.forEach((p) => {
          const maxScore = Array.isArray(p.testcases)
            ? p.testcases.reduce((sum, tc) => sum + (tc.score || 0), 0)
            : 0;
          analytics.problems[p._id] = {
            id: p._id,
            name: p.name,
            maxScore: maxScore,
            attemptedByUsers: new Set(),
            solvedByUsers: new Set(),
            submissionCount: 0,
            statusCounts: {},
            processorCounts: {},
            avgExecutionTimeAccepted: 0,
            _totalExecutionTimeForAccepted: 0,
            _acceptedSubmissionsExecutionCount: 0,
          };
          problemDetailsMap.set(p._id, { name: p.name, maxScore });
        });
      }

      if (!allUserSubmissions || allUserSubmissions.length === 0)
        return analytics;

      allUserSubmissions.forEach((userData) => {
        analytics.overall.usersWithSubmissions.add(userData.user._id);
        if (userData.problems && Array.isArray(userData.problems)) {
          userData.problems.forEach((problemSubmissionData) => {
            const problemId = problemSubmissionData.problem._id;
            const problemStat = analytics.problems[problemId];
            if (!problemStat) {
              console.warn(
                `Analytics: Problem ID ${problemId} from submissions not in contest problems.`
              );
              return;
            }
            if (
              problemSubmissionData.submissions &&
              Array.isArray(problemSubmissionData.submissions)
            ) {
              if (problemSubmissionData.submissions.length > 0)
                problemStat.attemptedByUsers.add(userData.user._id);
              problemSubmissionData.submissions.forEach((submission) => {
                analytics.overall.totalSubmissions++;
                problemStat.submissionCount++;
                const processor =
                  submission.processor || submission.language || "unknown";
                analytics.overall.processorCounts[processor] =
                  (analytics.overall.processorCounts[processor] || 0) + 1;
                problemStat.processorCounts[processor] =
                  (problemStat.processorCounts[processor] || 0) + 1;
                const overallStatusDetails =
                  getOverallSubmissionStatus(submission);
                const statusText = overallStatusDetails.status;
                problemStat.statusCounts[statusText] =
                  (problemStat.statusCounts[statusText] || 0) + 1;
                analytics.overall.overallStatusCounts[statusText] =
                  (analytics.overall.overallStatusCounts[statusText] || 0) + 1;
                if (
                  statusText === "Accepted" &&
                  submission.score === problemStat.maxScore
                ) {
                  problemStat.solvedByUsers.add(userData.user._id);
                  if (
                    submission.testcaseResults &&
                    submission.testcaseResults.length > 0
                  ) {
                    const executionTimes = submission.testcaseResults
                      .map((tc) => tc.execution_time || 0)
                      .filter((t) => typeof t === "number");
                    if (executionTimes.length > 0) {
                      const maxTcTime = Math.max(0, ...executionTimes);
                      problemStat._totalExecutionTimeForAccepted += maxTcTime;
                      problemStat._acceptedSubmissionsExecutionCount++;
                    }
                  }
                }
              });
            }
          });
        }
      });
      Object.values(analytics.problems).forEach((ps) => {
        if (ps._acceptedSubmissionsExecutionCount > 0) {
          ps.avgExecutionTimeAccepted =
            ps._totalExecutionTimeForAccepted /
            ps._acceptedSubmissionsExecutionCount;
        }
      });
      return analytics;
    };
  }, []);

  useEffect(() => {
    if (!contestId) {
      setError("Contest ID is missing.");
      setLoading(false);
      return;
    }
    const fetchAnalyticsData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [submissionsRes, contestRes] = await Promise.all([
          api.get(`/submission/owner?contest=${contestId}`),
          api.get(`/contest/${contestId}/owner`),
        ]);
        const allUserSubmissions = submissionsRes.data || [];
        const contestOwnerData = contestRes.data;
        const contestProblems = contestOwnerData?.problems || [];

        const processedData = processAnalytics(
          allUserSubmissions,
          contestProblems
        );
        setAnalyticsData(processedData);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load analytics data."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyticsData();
  }, [contestId, processAnalytics]);

  if (loading)
    return (
      <div className="flex justify-center items-center py-10 text-gray-700 dark:text-gray-300">
        <FiLoader className="animate-spin text-3xl text-blue-500" />
        <span className="ml-3">Loading Analytics...</span>
      </div>
    );
  if (error)
    return (
      <div className="flex flex-col items-center justify-center py-10 text-red-600 dark:text-red-400 px-4">
        <FiAlertTriangle className="text-4xl mb-3" />
        <p className="text-center">{error}</p>
      </div>
    );
  if (!analyticsData)
    return (
      <p className="text-center py-10 text-gray-600 dark:text-gray-400">
        No analytics data available to display.
      </p>
    );

  const { overall, problems } = analyticsData;

  return (
    <div className="space-y-8">
      <section className="p-4 md:p-6 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
          <FiActivity className="mr-3 text-blue-500 text-2xl" />
          Overall Contest Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <OverallStatCard
            title="Users with Submissions"
            value={overall.usersWithSubmissions.size}
            icon={FiUsers}
          />
          <OverallStatCard
            title="Total Submissions"
            value={overall.totalSubmissions}
            icon={FiFileText}
            iconColorClass="text-green-500 dark:text-green-400"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <LanguageDistributionChart
            processorCounts={overall.processorCounts}
            title="Language/Processor Distribution (Overall)"
          />
          <StatusDistributionChart
            statusCounts={overall.overallStatusCounts}
            title="Overall Submission Statuses"
          />
        </div>
      </section>

      <section className="p-4 md:p-6 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
          <FiPieChart className="mr-3 text-green-500 text-2xl" />
          Per-Problem Statistics
        </h2>
        {Object.values(problems).length > 0 ? (
          <div className="space-y-6">
            {Object.values(problems).map((problemStat) => (
              <ProblemAnalyticsCard
                key={problemStat.id}
                problemStat={problemStat}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 italic">
            No problem-specific submission data to analyze.
          </p>
        )}
      </section>
    </div>
  );
};

export default ContestAnalyticsTab;
