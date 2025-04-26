"use client";

import { FiPlay, FiSend, FiLoader } from "react-icons/fi";

export default function ExecuteButtons({
  language,
  setLanguage,
  handleExecute,
  handleContestSubmit,
  isLoadingRun,
  isLoadingSubmit,
}) {
  const supportedLanguages = [
    "cpp",
    "java",
    "python",
    "javascript",
    "rust",
    "go",
  ];

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="w-full sm:w-auto">
        <label htmlFor="language-select" className="sr-only">
          Select Language
        </label>
        <select
          id="language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={isLoadingRun || isLoadingSubmit}
          className="block w-full sm:w-40 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 dark:text-gray-100"
        >
          {supportedLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {lang === "cpp"
                ? "C++"
                : lang === "javascript"
                ? "JavaScript"
                : lang.charAt(0).toUpperCase() + lang.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex w-full sm:w-auto justify-end space-x-3">
        <button
          onClick={handleExecute}
          disabled={isLoadingRun || isLoadingSubmit}
          className="px-5 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 flex items-center gap-2 transition duration-150 ease-in-out"
          title="Run code with custom input"
        >
          {isLoadingRun ? (
            <FiLoader className="animate-spin" />
          ) : (
            <FiPlay size={18} />
          )}
          {isLoadingRun ? "Running..." : "Run"}
        </button>

        <button
          onClick={handleContestSubmit}
          disabled={isLoadingRun || isLoadingSubmit}
          className="px-5 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center gap-2 transition duration-150 ease-in-out"
          title="Submit solution for grading"
        >
          {isLoadingSubmit ? (
            <FiLoader className="animate-spin" />
          ) : (
            <FiSend size={18} />
          )}
          {isLoadingSubmit ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
