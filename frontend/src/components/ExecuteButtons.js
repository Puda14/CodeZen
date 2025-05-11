"use client";

import { FiPlay, FiSend, FiLoader } from "react-icons/fi";
import { supportedProcessors } from "@/config/processorConfig";

export default function ExecuteButtons({
  selectedKey,
  setSelectedKey,
  handleExecute,
  handleContestSubmit,
  isLoadingRun,
  isLoadingSubmit,
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="w-full sm:w-auto">
        <label htmlFor="language-select" className="sr-only">
          Select Language
        </label>
        <select
          id="language-select"
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
          disabled={isLoadingRun || isLoadingSubmit}
          className="block w-full sm:w-40 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 dark:text-gray-100"
        >
          {Object.entries(supportedProcessors).map(([key]) => (
            <option key={key} value={key}>
              {key}
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

        {handleContestSubmit && (
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
        )}
      </div>
    </div>
  );
}
