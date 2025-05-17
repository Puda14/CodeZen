"use client";

import React, { useState } from "react";
import { FiCopy, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useToast } from "@/context/ToastProvider";

const categoryStyleMap = {
  basic: "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200",
  edge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200",
  stress: "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
};

const GeneratedTestcaseCard = ({ testcase, index }) => {
  const [isOpen, setIsOpen] = useState(true);
  const { showToast } = useToast();

  const copyToClipboard = (textToCopy, type) => {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        showToast(`${type} copied to clipboard!`, "success");
      })
      .catch((err) => {
        showToast(`Failed to copy ${type}!`, "error");
      });
  };

  const categoryClass =
    categoryStyleMap[testcase.category?.toLowerCase()] ||
    categoryStyleMap.default;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700/80 transition rounded-t-lg focus:outline-none"
      >
        <span className="font-medium text-sm text-gray-700 dark:text-gray-200 text-left">
          Synthesized Test Case #{index + 1}
          <span
            className={`ml-2 text-xs px-1.5 py-0.5 rounded-full align-middle ${categoryClass}`}
          >
            {testcase.category || "Unknown"}
          </span>
        </span>
        {isOpen ? <FiChevronUp /> : <FiChevronDown />}
      </button>
      {isOpen && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-600 space-y-3">
          {testcase.explanation && (
            <div>
              <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5">
                Explanation:
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {testcase.explanation}
              </p>
            </div>
          )}
          <div>
            <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5 flex justify-between items-center">
              Input:
              <button
                onClick={() => copyToClipboard(testcase.input, "Input")}
                className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                title="Copy Input"
              >
                <FiCopy size={12} />
              </button>
            </h5>
            <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-60">
              {testcase.input || "<Empty Input>"}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratedTestcaseCard;
