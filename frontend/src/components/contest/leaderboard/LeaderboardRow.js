"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { FiAward } from "react-icons/fi";
import { motion } from "framer-motion";

const LeaderboardRow = React.memo(
  ({
    rank,
    entry,
    problemHeaders,
    contestId,
    isTotalScoreUpdated,
    updatedProblemKey,
  }) => {
    const problemScores = useMemo(() => {
      const scores = {};
      problemHeaders.forEach((header) => {
        const problemResult = entry.problems?.find((p) => p.p === header.key);
        scores[header.key] = problemResult?.score ?? "-";
      });
      return scores;
    }, [entry.problems, problemHeaders]);

    let rankColorClass = "";
    let textClass = "text-gray-800 dark:text-gray-100";
    let scoreTextClass = "text-gray-700 dark:text-gray-200";

    if (rank === 1) {
      rankColorClass = "bg-yellow-100 dark:bg-yellow-700/30";
      textClass = "font-semibold text-yellow-800 dark:text-yellow-200";
      scoreTextClass = "font-bold text-yellow-900 dark:text-yellow-100";
    } else if (rank === 2) {
      rankColorClass = "bg-gray-200 dark:bg-gray-600/40";
      textClass = "font-medium text-gray-700 dark:text-gray-200";
      scoreTextClass = "font-bold text-gray-800 dark:text-gray-100";
    } else if (rank === 3) {
      rankColorClass = "bg-orange-100 dark:bg-orange-800/30";
      textClass = "font-medium text-orange-800 dark:text-orange-300";
      scoreTextClass = "font-bold text-orange-900 dark:text-orange-200";
    } else if ((rank - 1) % 2 !== 0) {
      rankColorClass = "bg-gray-50/60 dark:bg-gray-800/60";
    }

    return (
      <motion.tr
        layout="position"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        key={entry.user._id}
        className={`${rankColorClass} hover:bg-blue-100/50 dark:hover:bg-blue-900/40`}
      >
        <td
          className={`px-4 py-3 whitespace-nowrap text-sm text-center ${textClass}`}
        >
          {rank === 1 && (
            <FiAward className="inline-block text-yellow-500 mr-1" />
          )}
          {rank === 2 && (
            <FiAward className="inline-block text-gray-500 mr-1" />
          )}
          {rank === 3 && (
            <FiAward className="inline-block text-orange-600 mr-1" />
          )}
          {rank}
        </td>
        <td
          className={`px-6 py-3 whitespace-nowrap text-sm font-medium ${textClass}`}
        >
          {entry.user?.username || "Unknown User"}
        </td>
        <td
          className={`relative px-6 py-3 whitespace-nowrap text-sm font-bold text-center ${scoreTextClass}`}
        >
          <span
            className={`absolute inset-0 ${
              isTotalScoreUpdated ? "animate-flash dark:dark:animate-flash" : ""
            }`}
          ></span>
          <span className="relative">{entry.totalScore ?? 0}</span>
        </td>
        {problemHeaders.map((header) => (
          <td
            key={`${entry.user?._id}-p${header.key}`}
            className={`relative px-4 py-3 whitespace-nowrap text-sm ${
              problemScores[header.key] > 0
                ? "text-green-600 dark:text-green-400 font-medium"
                : "text-gray-500 dark:text-gray-400"
            } text-center`}
          >
            <span
              className={`absolute inset-0 ${
                updatedProblemKey === header.key
                  ? "animate-flash dark:dark:animate-flash"
                  : ""
              }`}
            ></span>
            <span className="relative">{problemScores[header.key]}</span>
          </td>
        ))}
      </motion.tr>
    );
  }
);
LeaderboardRow.displayName = "LeaderboardRow";

export default LeaderboardRow;
