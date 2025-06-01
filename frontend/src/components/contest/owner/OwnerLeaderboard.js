"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/utils/coreApi";
import {
  FiDownload,
  FiLoader,
  FiEye,
  FiEyeOff,
  FiLock,
  FiUnlock,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";
import LeaderboardTable from "@/components/contest/leaderboard/LeaderboardTable";
import { useToast } from "@/context/ToastProvider";

const LeaderboardStatus = {
  OPEN: "open",
  FROZEN: "frozen",
  CLOSED: "closed",
};

const OwnerLeaderboard = ({ contestId }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentOfficialStatus, setCurrentOfficialStatus] = useState(null);
  const [isFetchingStatus, setIsFetchingStatus] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [fetchStatusError, setFetchStatusError] = useState(null);
  const { showToast } = useToast();

  const fetchOfficialStatus = useCallback(async () => {
    if (!contestId) return;

    setIsFetchingStatus(true);
    setFetchStatusError(null);
    try {
      const res = await api.get(`/leaderboard/${contestId}/status`);

      if (
        res.data &&
        res.data.status &&
        Object.values(LeaderboardStatus).includes(res.data.status)
      ) {
        setCurrentOfficialStatus(res.data.status);
      } else {
        console.warn(
          "API did not return a valid leaderboard status. Defaulting to 'open'. Response:",
          res.data
        );
        setCurrentOfficialStatus(LeaderboardStatus.OPEN);
        setFetchStatusError("Could not verify current status from server.");
      }
    } catch (err) {
      setCurrentOfficialStatus(LeaderboardStatus.OPEN);
      setFetchStatusError(
        err.response?.data?.message ||
          "Failed to fetch current leaderboard status."
      );
      showToast(
        "Error fetching leaderboard status. Controls might not reflect the actual state.",
        "error"
      );
    } finally {
      setIsFetchingStatus(false);
    }
  }, [contestId, showToast]);

  useEffect(() => {
    fetchOfficialStatus();
  }, [fetchOfficialStatus]);

  const handleDownloadCsv = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const res = await api.get(`/leaderboard/${contestId}`);
      const leaderboardData = res.data;

      if (
        !leaderboardData ||
        !leaderboardData.users ||
        leaderboardData.users.length === 0
      ) {
        showToast("No leaderboard data available to download.", "warning");
        return;
      }

      const sortedUsers = [...leaderboardData.users].sort(
        (a, b) =>
          (b.totalScore || 0) - (a.totalScore || 0) ||
          a.user?.username?.localeCompare(b.user?.username || "") ||
          0
      );
      const problemHeaders = (sortedUsers[0]?.problems || [])
        .map((p) => ({ key: p.p || "?", id: p.problemId }))
        .sort((a, b) => a.key.localeCompare(b.key));

      const escapeCsv = (field) => {
        if (field === null || field === undefined) return "";
        const stringField = String(field);
        if (
          stringField.includes(",") ||
          stringField.includes("\n") ||
          stringField.includes('"')
        ) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      };

      const headers = [
        "Rank",
        "User",
        "Total Score",
        ...problemHeaders.map((h) => h.key),
      ];
      const csvHeader = headers.map(escapeCsv).join(",");
      const csvRows = sortedUsers.map((entry, index) => {
        const rank = index + 1;
        const username = entry.user?.username || "Unknown";
        const totalScore = entry.totalScore ?? 0;
        const scoresMap = new Map(
          entry.problems?.map((p) => [p.p, p.score ?? 0])
        );
        const scores = problemHeaders.map(
          (header) => scoresMap.get(header.key) ?? 0
        );
        const row = [rank, username, totalScore, ...scores];
        return row.map(escapeCsv).join(",");
      });

      const csvContent = [csvHeader, ...csvRows].join("\n");

      const blob = new Blob([`\uFEFF${csvContent}`], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `leaderboard_${contestId}_${
            new Date().toISOString().split("T")[0]
          }.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast("Leaderboard CSV downloaded successfully.", "success");
      } else {
        showToast("CSV download is not supported in your browser.", "error");
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to download leaderboard data.",
        "error"
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleChangeStatus = async (newStatus) => {
    if (!contestId || isUpdatingStatus || newStatus === currentOfficialStatus) {
      console.warn("Change status request ignored:", {
        isUpdatingStatus,
        newStatus,
        currentOfficialStatus,
      });
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await api.post(`/leaderboard/${contestId}/status`, {
        status: newStatus,
      });

      setCurrentOfficialStatus(newStatus);
      showToast(
        `Leaderboard status successfully changed to ${newStatus}.`,
        "success",
        { duration: 5000 }
      );
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          `Failed to change status to ${newStatus}. Please try again.`,
        "error"
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const renderStatusControls = () => {
    if (isFetchingStatus) {
      return (
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <FiLoader className="animate-spin mr-2" /> Loading Status Controls...
        </div>
      );
    }

    if (fetchStatusError) {
      return (
        <div className="flex items-center text-sm text-red-600 dark:text-red-400">
          <FiAlertCircle className="mr-2" />
          {fetchStatusError}
          <button
            onClick={fetchOfficialStatus}
            disabled={isFetchingStatus}
            className="ml-2 p-1 text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
          >
            <FiRefreshCw
              className={`inline h-4 w-4 ${
                isFetchingStatus ? "animate-spin" : ""
              }`}
            />{" "}
            Retry
          </button>
        </div>
      );
    }

    const buttonBaseClass =
      "inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed mr-2 transition-colors duration-150";
    const activeClass = "ring-2";
    const buttonClasses = {
      [LeaderboardStatus.OPEN]:
        "border-green-300 bg-white dark:bg-gray-800 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-gray-700 focus:ring-green-500",
      [LeaderboardStatus.FROZEN]:
        "border-blue-300 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-gray-700 focus:ring-blue-500",
      [LeaderboardStatus.CLOSED]:
        "border-red-300 bg-white dark:bg-gray-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-gray-700 focus:ring-red-500",
    };
    const activeIndicatorClass = {
      [LeaderboardStatus.OPEN]: "bg-green-100 dark:bg-green-900/50",
      [LeaderboardStatus.FROZEN]: "bg-blue-100 dark:bg-blue-900/50",
      [LeaderboardStatus.CLOSED]: "bg-red-100 dark:bg-red-900/50",
    };

    const statusIcons = {
      [LeaderboardStatus.OPEN]: <FiUnlock className="mr-1 h-4 w-4" />,
      [LeaderboardStatus.FROZEN]: <FiEyeOff className="mr-1 h-4 w-4" />,
      [LeaderboardStatus.CLOSED]: <FiLock className="mr-1 h-4 w-4" />,
    };

    return (
      <div className="flex flex-wrap items-center">
        <span className="text-sm font-medium mr-3 text-gray-700 dark:text-gray-300 mb-2 sm:mb-0">
          Leaderboard Status:
        </span>
        {Object.values(LeaderboardStatus).map((status) => (
          <button
            key={status}
            onClick={() => handleChangeStatus(status)}
            disabled={isUpdatingStatus || currentOfficialStatus === status}
            className={`${buttonBaseClass} ${buttonClasses[status]} ${
              currentOfficialStatus === status
                ? `${activeClass} ${activeIndicatorClass[status]}`
                : ""
            } mb-2 sm:mb-0`}
            title={
              currentOfficialStatus === status
                ? `Leaderboard is currently ${status}`
                : `Change status to ${status}`
            }
          >
            {isUpdatingStatus && currentOfficialStatus !== status ? (
              <FiLoader className="animate-spin mr-1 h-4 w-4" />
            ) : (
              statusIcons[status]
            )}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
        <button
          onClick={fetchOfficialStatus}
          disabled={isFetchingStatus || isUpdatingStatus}
          className="ml-auto sm:ml-2 p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 mb-2 sm:mb-0"
          title="Refresh current status"
        >
          <FiRefreshCw
            className={`h-4 w-4 ${isFetchingStatus ? "animate-spin" : ""}`}
          />
        </button>
      </div>
    );
  };

  return (
    <div className="owner-leaderboard-container space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        {renderStatusControls()}

        <button
          onClick={handleDownloadCsv}
          disabled={isDownloading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          {isDownloading ? (
            <FiLoader className="animate-spin -ml-1 mr-2 h-5 w-5" />
          ) : (
            <FiDownload className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          )}
          {isDownloading ? "Downloading..." : "Download CSV"}
        </button>
      </div>

      <LeaderboardTable
        contestId={contestId}
        leaderboardStatus={LeaderboardStatus.OPEN}
        ignoreStatusUpdates={true}
        linkProblemHeaders={false}
        userRole="owner"
      />
    </div>
  );
};

export default OwnerLeaderboard;
