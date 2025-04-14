"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiClock, FiUser, FiLock, FiGlobe } from "react-icons/fi";
import { format } from "date-fns";
import api from "@/utils/coreApi";
import { motion } from "framer-motion";

const ContestDetailOwnerPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContest = async () => {
      try {
        const res = await api.get(`/contest/${id}/owner`);
        setContest(res.data);
      } catch (err) {
        console.error("Failed to fetch contest as owner:", err);
        router.push("/contests");
      } finally {
        setLoading(false);
      }
    };

    fetchContest();
  }, [id]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  if (!contest) return <p className="text-center mt-10">Contest not found</p>;

  const isPublic = contest.isPublic;
  const statusColor =
    contest.status === "upcoming"
      ? "text-green-500"
      : contest.status === "ongoing"
      ? "text-purple-500"
      : "text-gray-500";

  return (
    <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-6 mt-8 relative">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition mb-4"
        title="Go back"
      >
        <FiArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </button>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        {contest.title}
      </h1>

      <p className="text-gray-700 dark:text-gray-300 text-lg">
        {contest.description}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
          <FiClock className="text-blue-500" />
          <span>
            <strong>Start:</strong>{" "}
            {format(new Date(contest.start_time), "PPPpp")}
          </span>
        </div>
        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
          <FiClock className="text-red-500" />
          <span>
            <strong>End:</strong> {format(new Date(contest.end_time), "PPPpp")}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-300 text-sm mt-6">
        <div className="flex items-center gap-2">
          <FiUser className="text-purple-500" />
          <span className="font-medium">
            Created by: {contest.owner.username}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isPublic ? (
            <>
              <FiGlobe className="text-green-500" />
              <span className="font-medium">Public</span>
            </>
          ) : (
            <>
              <FiLock className="text-red-500" />
              <span className="font-medium">Private</span>
            </>
          )}
        </div>

        <div className={`font-bold uppercase ${statusColor}`}>
          Status: {contest.status}
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          Problems
        </h2>
        {contest.problems.map((problem) => (
          <div
            key={problem._id}
            className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
          >
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              {problem.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Difficulty: <strong>{problem.difficulty}</strong>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Tags: {problem.tags.join(", ")}
            </p>
            <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
              {problem.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContestDetailOwnerPage;
