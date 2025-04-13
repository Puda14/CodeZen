"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { FiClock, FiUser, FiLock, FiGlobe } from "react-icons/fi";

const ContestItem = ({ contest }) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/contests/${contest._id}`);
  };

  const isPublic = contest.isPublic;
  const statusColor =
    contest.status === "upcoming"
      ? "border-green-400"
      : contest.status === "ongoing"
      ? "border-purple-500"
      : "border-gray-400";

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer border-l-4 ${statusColor} bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 hover:shadow-lg hover:scale-[1.01] transition-all duration-200`}
    >
      {/* Title */}
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
        {contest.title}
      </h2>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        {contest.description}
      </p>

      {/* Info row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <FiClock className="text-blue-500" />
          {format(new Date(contest.start_time), "PPPpp")} →{" "}
          {format(new Date(contest.end_time), "PPPpp")}
        </div>

        <div className="flex items-center gap-2">
          <FiUser className="text-purple-500" />
          {contest.owner.username}
        </div>

        <div className="flex items-center gap-2">
          {isPublic ? (
            <>
              <FiGlobe className="text-green-500" />
              <span>Public</span>
            </>
          ) : (
            <>
              <FiLock className="text-red-500" />
              <span>Private</span>
            </>
          )}
        </div>

        <div className="text-right sm:text-left font-semibold text-blue-600 dark:text-blue-400">
          {contest.status.toUpperCase()}
        </div>
      </div>
    </div>
  );
};

export default ContestItem;
