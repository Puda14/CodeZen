"use client";

import { useState, useCallback } from "react";
import {
  FiLoader,
  FiAlertTriangle,
  FiEye,
  FiCopy,
  FiChevronDown,
  FiChevronUp,
  FiSearch,
} from "react-icons/fi";
import api from "@/utils/coreApi";
import MonacoCodeViewer from "@/components/MonacoCodeViewer";
import { useToast } from "@/context/ToastProvider";

const FiEyeOff = (props) => (
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

const SubmissionCodeCard = ({ submission }) => {
  const [isCodeVisible, setIsCodeVisible] = useState(false);
  const { showToast } = useToast();

  const copyToClipboard = (text) => {
    if (!text) {
      showToast("No code to copy.", "warning");
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => showToast("Code copied to clipboard!", "success"))
      .catch(() => showToast("Failed to copy code.", "error"));
  };

  const codeContent =
    submission.code || "// No code available for this submission.";
  const language = submission.language || "cpp";

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-100 dark:bg-gray-700/70 shadow-sm">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
        <div className="text-sm">
          <p>
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              User:
            </span>{" "}
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              {submission.username}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              {" "}
              ({submission.user_id?.slice(-6)})
            </span>
          </p>
          <p>
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              Submission ID:
            </span>{" "}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {submission.submission_id}
            </span>
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => copyToClipboard(codeContent)}
            className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Copy Code"
            aria-label="Copy Code"
          >
            <FiCopy size={16} />
          </button>
          <button
            onClick={() => setIsCodeVisible(!isCodeVisible)}
            className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            title={isCodeVisible ? "Hide Code" : "Show Code"}
            aria-label={isCodeVisible ? "Hide Code" : "Show Code"}
            aria-expanded={isCodeVisible}
          >
            {isCodeVisible ? <FiEyeOff size={16} /> : <FiEye size={16} />}
          </button>
        </div>
      </div>

      {isCodeVisible && (
        <div className="mt-2 border-t border-gray-200 dark:border-gray-600 pt-2">
          <MonacoCodeViewer
            value={codeContent}
            language={language}
            height="250px"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      )}
    </div>
  );
};

const SuspiciousGroupCard = ({ group, groupIndex }) => {
  const [isOpen, setIsOpen] = useState(groupIndex === 0);

  return (
    <div className="mb-4 border border-orange-400 dark:border-orange-600 rounded-lg bg-orange-50 dark:bg-gray-800 shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-3 text-left bg-orange-100 dark:bg-orange-700/50 hover:bg-orange-200 dark:hover:bg-orange-600/50 rounded-t-lg transition-colors"
        aria-expanded={isOpen}
      >
        <h4 className="text-md font-semibold text-orange-800 dark:text-orange-300">
          Suspicious Group #{groupIndex + 1} ({group.length} submissions)
        </h4>
        {isOpen ? (
          <FiChevronUp className="text-orange-700 dark:text-orange-400" />
        ) : (
          <FiChevronDown className="text-orange-700 dark:text-orange-400" />
        )}
      </button>
      {isOpen && (
        <div className="p-3 border-t border-orange-200 dark:border-orange-700 space-y-3">
          {group.map((submission, subIndex) => (
            <SubmissionCodeCard
              key={submission.submission_id || `sub-${groupIndex}-${subIndex}`}
              submission={submission}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ContestCheckCodeTab = ({ contestId }) => {
  const [checkCodeData, setCheckCodeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasChecked, setHasChecked] = useState(false);

  const fetchCheckCodeData = useCallback(async () => {
    if (!contestId) {
      setError("Contest ID is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setCheckCodeData(null);
    setHasChecked(true);
    try {
      const response = await api.get(
        `/submission/check/semantic-code?contest=${contestId}`
      );
      setCheckCodeData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load suspicious code data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <button
          onClick={fetchCheckCodeData}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg inline-flex items-center shadow-md transition-colors duration-150 disabled:opacity-70 disabled:cursor-wait"
        >
          {loading ? (
            <FiLoader className="animate-spin mr-2 h-5 w-5" />
          ) : (
            <FiSearch className="mr-2 h-5 w-5" />
          )}
          {loading ? "Checking..." : "Start Code Similarity Check"}
        </button>
        {hasChecked && !loading && !error && checkCodeData && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Check completed. Click again to re-check.
          </p>
        )}
      </div>

      {loading && (
        <div className="flex flex-col justify-center items-center py-10 text-gray-700 dark:text-gray-300">
          <FiLoader className="animate-spin text-3xl text-blue-500" />
          <span className="mt-2">Loading Suspicious Code Data...</span>
        </div>
      )}

      {error && !loading && (
        <div className="my-4 p-4 bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300 rounded-md text-sm flex items-start shadow-md border border-red-200 dark:border-red-700">
          <FiAlertTriangle className="mr-3 flex-shrink-0 h-5 w-5 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Error Loading Data</p>
            <p className="text-xs">{error}</p>
          </div>
        </div>
      )}

      {hasChecked && !loading && !error && (
        <>
          {!checkCodeData ||
          !checkCodeData.results ||
          checkCodeData.results.length === 0 ? (
            <div className="py-10 text-center text-gray-500 dark:text-gray-400">
              No suspicious code data found for this contest or no problems to
              check.
            </div>
          ) : (
            checkCodeData.results.map((problemResult) => (
              <div
                key={problemResult.problem_id}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 border-b border-gray-300 dark:border-gray-600 pb-3">
                  Problem: {problemResult.problem_name}
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    (ID: ...{problemResult.problem_id.slice(-6)})
                  </span>
                </h3>
                {problemResult.checkResult &&
                problemResult.checkResult.length > 0 ? (
                  <div className="space-y-4">
                    {problemResult.checkResult.map((group, groupIndex) => (
                      <SuspiciousGroupCard
                        key={`group-${problemResult.problem_id}-${groupIndex}`}
                        group={group}
                        groupIndex={groupIndex}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic py-3">
                    No suspicious code groups found for this problem.
                  </p>
                )}
              </div>
            ))
          )}
        </>
      )}
      {!hasChecked && !loading && (
        <div className="py-10 text-center text-gray-400 dark:text-gray-500 italic">
          Click the button above to start the code similarity check.
        </div>
      )}
    </div>
  );
};

export default ContestCheckCodeTab;
