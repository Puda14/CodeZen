"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import Link from "next/link";
import {
  FiLoader,
  FiAlertTriangle,
  FiAward,
  FiInfo,
  FiLock,
} from "react-icons/fi";
import { socket } from "@/utils/socket/socketService";
import { motion } from "framer-motion";
import Cookies from "js-cookie";
import LeaderboardRow from "./LeaderboardRow";
import api from "@/utils/coreApi";

const LeaderboardStatus = {
  OPEN: "open",
  FROZEN: "frozen",
  CLOSED: "closed",
};

/**
 * Displays the contest leaderboard with real-time score and status updates.
 * Can optionally ignore status updates and problem header links (e.g., for Owner view).
 *
 * @param {object} props - Component props.
 * @param {string} props.contestId - The ID of the contest (required).
 * @param {'open' | 'frozen' | 'closed'} [props.leaderboardStatus='open'] - Initial leaderboard status.
 * @param {boolean} [props.ignoreStatusUpdates=false] - If true, ignores WebSocket status updates.
 * @param {boolean} [props.linkProblemHeaders=true] - If true, problem headers link to problem pages.
 */
const LeaderboardTable = ({
  contestId,
  leaderboardStatus: initialLeaderboardStatus = LeaderboardStatus.OPEN,
  ignoreStatusUpdates = false,
  linkProblemHeaders = true,
}) => {
  const [rawLeaderboardData, setRawLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [currentStatus, setCurrentStatus] = useState(initialLeaderboardStatus);
  const previousUsersRef = useRef([]);
  const [updatedEntries, setUpdatedEntries] = useState({});

  const sortedUsers = useMemo(() => {
    const users = rawLeaderboardData?.users || [];
    if (users.length === 0) return [];
    return [...users].sort((a, b) => {
      const scoreDiff = (b.totalScore || 0) - (a.totalScore || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return a.user?.username?.localeCompare(b.user?.username || "") || 0;
    });
  }, [rawLeaderboardData]);

  const problemHeaders = useMemo(() => {
    const firstUserProblems = rawLeaderboardData?.users?.[0]?.problems;
    if (Array.isArray(firstUserProblems)) {
      return firstUserProblems
        .map((p) => ({ key: p.p || "?", id: p.problemId }))
        .sort((a, b) => a.key.localeCompare(b.key));
    }
    return [];
  }, [rawLeaderboardData]);

  const detectChangesAndFlash = useCallback(
    (newData, statusNow) => {
      if (statusNow !== LeaderboardStatus.OPEN) {
        previousUsersRef.current = newData?.users || [];
        return;
      }

      const newUsers = newData?.users || [];
      const updates = {};
      const currentUsersMap = new Map(
        (previousUsersRef.current || []).map((u) => [u.user._id, u])
      );

      newUsers.forEach((newUser) => {
        const oldUser = currentUsersMap.get(newUser.user._id);
        const userUpdates = { totalScore: false, problemKey: null };
        let userUpdated = false;

        if (oldUser) {
          if ((newUser.totalScore || 0) !== (oldUser.totalScore || 0)) {
            userUpdates.totalScore = true;
            userUpdated = true;
          }
          const newProblemsMap = new Map(
            newUser.problems?.map((p) => [p.problemId, p])
          );
          oldUser.problems?.forEach((oldP) => {
            const newP = newProblemsMap.get(oldP.problemId);
            if (
              newP &&
              newP.score !== undefined &&
              newP.score > (oldP.score ?? -1)
            ) {
              userUpdates.problemKey = newP.p;
              userUpdated = true;
            }
          });
        } else {
          userUpdates.totalScore = true;
          userUpdated = true;
        }

        if (userUpdated) {
          updates[newUser.user._id] = userUpdates;
        }
      });

      if (Object.keys(updates).length > 0) {
        setUpdatedEntries(updates);
        setTimeout(() => setUpdatedEntries({}), 900);
      }
      previousUsersRef.current = newUsers;
    },
    [contestId]
  );

  useEffect(() => {
    setCurrentStatus(initialLeaderboardStatus);
  }, [initialLeaderboardStatus, contestId]);
  useEffect(() => {
    if (currentStatus === LeaderboardStatus.FROZEN && !ignoreStatusUpdates) {
      // Khi frozen: fetch snapshot 1 lần qua API
      const fetchFrozenSnapshot = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/leaderboard/${contestId}`);
          setRawLeaderboardData(response.data);
          setLoading(false);
        } catch (err) {
          setError("Failed to load frozen leaderboard.");
          setLoading(false);
        }
      };

      fetchFrozenSnapshot();
    }
  }, [currentStatus, contestId, ignoreStatusUpdates]);

  useEffect(() => {
    if (!contestId) {
      setError("Contest ID is missing.");
      setLoading(false);
      return;
    }

    // --- Reset state when contestId changes ---
    setRawLeaderboardData(null);
    setLoading(true);
    setError(null);
    previousUsersRef.current = [];
    setUpdatedEntries({});
    setIsConnected(socket.connected);

    // --- WebSocket Event Handlers ---
    const handleConnect = () => {
      setIsConnected(true);
      setError(null);
      socket.emit("join_leaderboard_room", contestId);
    };
    const handleDisconnect = (reason) => {
      setIsConnected(false);
      if (reason !== "io client disconnect")
        setError("Connection lost. Trying to reconnect...");
    };
    const handleConnectError = (err) => {
      setIsConnected(false);
      setError(`Connection issue: ${err.message}.`);
      setLoading(false);
    };
    const handleLeaderboardUpdate = (data) => {
      if (
        data?.contestId === contestId &&
        (ignoreStatusUpdates || currentStatus !== LeaderboardStatus.FROZEN)
      ) {
        setRawLeaderboardData(data);
        detectChangesAndFlash(data, currentStatus);
        setLoading(false);
      }
    };
    const handleLeaderboardError = (errorData) => {
      setError(errorData?.message || "Error receiving leaderboard data.");
      setLoading(false);
    };
    // Handles status updates from WebSocket
    const handleLeaderboardStatusUpdate = (data) => {
      if (ignoreStatusUpdates) return;

      if (
        data?.contestId === contestId &&
        data?.status &&
        Object.values(LeaderboardStatus).includes(data.status)
      ) {
        setCurrentStatus(data.status);
      } else {
        console.warn(
          "LeaderboardTable: Invalid status update payload received.",
          { data }
        );
      }
    };

    if (!socket.connected) {
      const token = Cookies.get("token");
      socket.auth = { token };
      socket.connect();
    } else {
      socket.emit("join_leaderboard_room", contestId);
    }

    // Register listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("leaderboard_error", handleLeaderboardError);
    socket.on("leaderboard_update", handleLeaderboardUpdate);
    socket.on("leaderboard_status_update", handleLeaderboardStatusUpdate);

    // Runs on unmount or when contestId changes
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("leaderboard_error", handleLeaderboardError);
      socket.off("leaderboard_update", handleLeaderboardUpdate);
      socket.off("leaderboard_status_update", handleLeaderboardStatusUpdate);
      socket.emit("leave_leaderboard_room", contestId);
    };
  }, [contestId, ignoreStatusUpdates, currentStatus, detectChangesAndFlash]);

  // --- Render Logic ---

  // 1. Loading State
  if (loading) {
    return (
      <div className="flex justify-center items-center py-10 text-gray-500 dark:text-gray-400">
        <FiLoader className="animate-spin text-2xl text-blue-500 dark:text-blue-400" />
        <span className="ml-3">Loading Leaderboard...</span>
      </div>
    );
  }

  // 2. Error State (if no data could be loaded)
  if (error && !rawLeaderboardData) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700/50 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <FiAlertTriangle className="text-3xl mb-2" />
        <p className="font-semibold">Failed to load leaderboard</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  // 3. Closed State (Only renders if status is CLOSED and updates are NOT ignored)
  if (currentStatus === LeaderboardStatus.CLOSED && !ignoreStatusUpdates) {
    return (
      <div className="text-center py-10 px-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <FiLock className="mx-auto text-4xl text-gray-400 dark:text-gray-500 mb-3" />
        <p className="text-gray-600 dark:text-gray-400">
          The leaderboard is currently closed by the contest owner.
        </p>
        {error && !isConnected && (
          <p className="mt-2 text-xs text-red-500 dark:text-red-400">
            ({error})
          </p>
        )}
      </div>
    );
  }

  // 4. Empty State (if no users in the leaderboard)
  if (!sortedUsers || sortedUsers.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-10 border border-gray-200 dark:border-gray-700 rounded-lg">
        <p>Leaderboard is currently empty.</p>
        {/* Show Frozen status only if status is FROZEN and updates are NOT ignored */}
        {currentStatus === LeaderboardStatus.FROZEN && !ignoreStatusUpdates && (
          <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">
            (Status: Frozen)
          </p>
        )}
        {error && !isConnected && (
          <p className="mt-2 text-xs text-red-500 dark:text-red-400">
            ({error})
          </p>
        )}
      </div>
    );
  }

  // 5. Main Table Render
  return (
    <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Status/Error Banners */}
      {error && !isConnected && (
        <div className="p-2 text-center text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
          <FiAlertTriangle className="inline-block mr-1" /> {error}
        </div>
      )}
      {!error && !isConnected && currentStatus === LeaderboardStatus.OPEN && (
        <div className="p-2 text-center text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300">
          Real-time updates paused (Connection issue). Displaying last known
          data.
        </div>
      )}
      {/* Frozen Banner only renders if status is FROZEN and updates are NOT ignored */}
      {currentStatus === LeaderboardStatus.FROZEN && !ignoreStatusUpdates && (
        <div className="p-2 text-center text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
          <FiInfo className="inline-block mr-1" /> Leaderboard is frozen.
          Updates are not displayed.
        </div>
      )}

      {/* The Table */}
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        {/* Table Header */}
        <thead className="bg-gray-100 dark:bg-gray-700/50 sticky top-0 z-10">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-16"
            >
              Rank
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider min-w-[150px]"
            >
              User
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
            >
              Total Score
            </th>
            {/* Problem Headers - Conditionally linked */}
            {problemHeaders.map((header) => (
              <th
                key={header.key}
                scope="col"
                className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-20"
              >
                {/* Render Link only if linkProblemHeaders is true AND header.id exists */}
                {linkProblemHeaders && header.id ? (
                  <Link
                    href={`/contests/${contestId}/problem/${header.id}`}
                    className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                    title={`View Problem ${header.key}`}
                  >
                    {header.key}
                  </Link>
                ) : (
                  <span>{header.key}</span> // Otherwise, render plain text
                )}
              </th>
            ))}
          </tr>
        </thead>
        {/* Table Body with animation */}
        <motion.tbody
          layout
          className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 leaderboard-tbody-animating"
        >
          {/* Map through sorted users and render rows */}
          {sortedUsers.map((entry, index) => (
            <LeaderboardRow
              key={entry.user._id}
              rank={index + 1}
              entry={entry}
              problemHeaders={problemHeaders}
              contestId={contestId}
              isTotalScoreUpdated={
                currentStatus === LeaderboardStatus.OPEN &&
                !!updatedEntries[entry.user._id]?.totalScore
              }
              updatedProblemKey={
                currentStatus === LeaderboardStatus.OPEN
                  ? updatedEntries[entry.user._id]?.problemKey
                  : null
              }
            />
          ))}
        </motion.tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;
