import Link from "next/link";
import { FiChevronRight, FiTag } from "react-icons/fi";

const ProblemListTake = ({ problems = [], contestId }) => {
  if (!problems || problems.length === 0) {
    return (
      <p className="text-center text-gray-500">
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

  return (
    <div className="space-y-4">
      {problems.map((problem, index) => (
        <Link
          href={`/contests/${contestId}/problem/${problem._id}`}
          key={problem._id || index}
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
            <div className="flex-shrink-0 self-center">
              <FiChevronRight
                className="text-gray-400 dark:text-gray-500"
                size={24}
              />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ProblemListTake;
