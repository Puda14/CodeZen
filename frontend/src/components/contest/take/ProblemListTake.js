"use client";

import Link from "next/link";
import { FiChevronRight, FiTag, FiStar } from "react-icons/fi";
import { motion } from "framer-motion";

const ProblemListTake = ({ problems = [], contestId }) => {
  if (!problems || problems.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-10">
        No problems available for this contest.
      </p>
    );
  }

  const getDifficultyClass = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "normal":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "hard":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "very hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const tagClass =
    "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1";

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.05,
        duration: 0.3,
        ease: "easeOut",
      },
    }),
    hover: {
      scale: 1.03,
      transition: { duration: 0.2, ease: "easeInOut" },
    },
    tap: {
      scale: 0.98,
    },
  };

  return (
    <div className="space-y-4">
      {problems.map((problem, index) => {
        const totalProblemScore = Array.isArray(problem.testcases)
          ? problem.testcases.reduce((sum, tc) => sum + (tc.score || 0), 0)
          : 0;

        return (
          <motion.div
            key={problem._id || index}
            custom={index}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            className="block"
          >
            <Link
              href={`/contests/${contestId}/problem/${problem._id}`}
              className="block p-5 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div className="flex-grow mr-4">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    Problem {index + 1}: {problem.name || "Unnamed Problem"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {problem.difficulty && (
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded ${getDifficultyClass(
                          problem.difficulty
                        )}`}
                      >
                        {problem.difficulty}
                      </span>
                    )}
                    {problem.tags &&
                      problem.tags.length > 0 &&
                      problem.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className={tagClass}>
                          <FiTag size={12} />
                          {tag}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="flex flex-col items-end flex-shrink-0 ml-2">
                  <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                    <FiStar className="w-4 h-4 mr-1 text-yellow-500" />
                    <span>{totalProblemScore} points</span>
                  </div>
                  {typeof problem.maxSubmissions === "number" && (
                    <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      <span>Max Submissions: {problem.maxSubmissions}</span>
                    </div>
                  )}
                  <div className="mt-auto">
                    <FiChevronRight
                      className="text-gray-400 dark:text-gray-500"
                      size={24}
                    />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ProblemListTake;
