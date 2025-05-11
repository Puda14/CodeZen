"use client";

import React from "react";
import LanguageDistributionChart from "./LanguageDistributionChart";
import StatusDistributionChart from "./StatusDistributionChart";

const formatExecutionTime = (timeInSeconds) => {
  if (typeof timeInSeconds !== "number" || timeInSeconds < 0) return "-";
  if (timeInSeconds < 1) return `${(timeInSeconds * 1000).toFixed(0)} ms`;
  return `${timeInSeconds.toFixed(3)} s`;
};

const ProblemAnalyticsCard = ({ problemStat }) => {
  const successRate =
    problemStat.attemptedByUsers.size > 0
      ? (
          (problemStat.solvedByUsers.size / problemStat.attemptedByUsers.size) *
          100
        ).toFixed(1)
      : 0;

  return (
    <div className="p-4 md:p-5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-1">
        {problemStat.name}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        (Max Score: {problemStat.maxScore})
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-sm mb-4">
        <div className="p-2.5 bg-gray-100 dark:bg-gray-700/40 rounded">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Attempted by
          </p>
          <p className="font-semibold text-gray-700 dark:text-gray-200">
            {problemStat.attemptedByUsers.size} users
          </p>
        </div>
        <div className="p-2.5 bg-gray-100 dark:bg-gray-700/40 rounded">
          <p className="text-xs text-gray-500 dark:text-gray-400">Solved by</p>
          <p className="font-semibold text-gray-700 dark:text-gray-200">
            {problemStat.solvedByUsers.size} users
          </p>
        </div>
        <div className="p-2.5 bg-gray-100 dark:bg-gray-700/40 rounded">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Success Rate
          </p>
          <p className="font-semibold text-gray-700 dark:text-gray-200">
            {successRate}%
          </p>
        </div>
        <div className="p-2.5 bg-gray-100 dark:bg-gray-700/40 rounded">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total Submissions
          </p>
          <p className="font-semibold text-gray-700 dark:text-gray-200">
            {problemStat.submissionCount}
          </p>
        </div>
        <div className="p-2.5 bg-gray-100 dark:bg-gray-700/40 rounded">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Avg. Exec. Time (AC)
          </p>
          <p className="font-semibold text-gray-700 dark:text-gray-200">
            {problemStat.avgExecutionTimeAccepted > 0
              ? formatExecutionTime(problemStat.avgExecutionTimeAccepted)
              : "N/A"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <LanguageDistributionChart
          processorCounts={problemStat.processorCounts}
          title={`Languages (${problemStat.name})`}
        />
        <StatusDistributionChart
          statusCounts={problemStat.statusCounts}
          title={`Statuses (${problemStat.name})`}
        />
      </div>
    </div>
  );
};

export default ProblemAnalyticsCard;
