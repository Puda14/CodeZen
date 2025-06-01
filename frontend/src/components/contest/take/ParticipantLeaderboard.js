"use client";

import React, { useState, useEffect } from "react";
import api from "@/utils/coreApi";
import { FiLoader } from "react-icons/fi";
import LeaderboardTable from "@/components/contest/leaderboard/LeaderboardTable";
import { useToast } from "@/context/ToastProvider";

/**
 * Fetches the initial leaderboard status and renders the LeaderboardTable.
 * @param {string} contestId - The ID of the contest.
 */
const ParticipantLeaderboard = ({ contestId }) => {
  const [initialStatus, setInitialStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (contestId) {
      let isActive = true;
      setLoadingStatus(true);
      setStatusError(null);

      api
        .get(`/leaderboard/${contestId}/status`)
        .then((res) => {
          if (isActive) {
            if (
              res.data &&
              res.data.status &&
              ["open", "frozen", "closed"].includes(res.data.status)
            ) {
              setInitialStatus(res.data.status);
            } else {
              console.warn(
                `ParticipantLeaderboard: Invalid status data received for ${contestId}, defaulting to 'open'.`,
                res.data
              );
              setInitialStatus("open");
            }
          }
        })
        .catch((err) => {
          if (isActive) {
            setStatusError(
              err.response?.data?.message ||
                "Failed to load leaderboard status."
            );
            setInitialStatus("open");
            showToast("Could not load leaderboard status.", "error");
          }
        })
        .finally(() => {
          if (isActive) {
            setLoadingStatus(false);
          }
        });

      return () => {
        isActive = false;
      };
    } else {
      setLoadingStatus(false);
      setInitialStatus("open");
    }
  }, [contestId]);

  if (loadingStatus) {
    return (
      <div className="flex justify-center items-center py-10 text-gray-500 dark:text-gray-400">
        <FiLoader className="animate-spin text-2xl text-blue-500 dark:text-blue-400" />
        <span className="ml-3">Loading Leaderboard Status...</span>
      </div>
    );
  }

  return (
    <div className="participant-leaderboard-container">
      <LeaderboardTable
        contestId={contestId}
        leaderboardStatus={initialStatus ?? "open"}
        userRole="participant"
        waitForStatusInit={true}
      />
    </div>
  );
};

export default ParticipantLeaderboard;
