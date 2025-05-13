"use client";

import React, { useState } from "react";
import { FiCopy, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useToast } from "@/context/ToastProvider";

const StepCard = ({ title, data, isInitiallyOpen = false }) => {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);
  const { showToast } = useToast();

  const copyToClipboard = (textToCopy, type = "JSON") => {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        showToast(`${type} copied to clipboard!`, "success");
      })
      .catch((err) => {
        showToast(`Failed to copy ${type}!`, "error");
      });
  };

  let contentToDisplay = null;
  if (data && typeof data === "object") {
    if (title && title.toLowerCase().includes("generate cases")) {
      contentToDisplay = (
        <div className="space-y-3 text-xs">
          {Object.entries(data).map(([category, casesArray]) => (
            <div key={category}>
              <h5 className="font-semibold text-gray-600 dark:text-gray-400 capitalize">
                {category}:
              </h5>
              {Array.isArray(casesArray) && casesArray.length > 0 ? (
                <ul className="list-disc list-inside pl-4 text-gray-500 dark:text-gray-300">
                  {casesArray.map((caseDesc, idx) => (
                    <li key={`${category}-${idx}`}>{caseDesc}</li>
                  ))}
                </ul>
              ) : (
                <p className="italic text-gray-400 dark:text-gray-500">
                  No cases for this category.
                </p>
              )}
            </div>
          ))}
        </div>
      );
    } else {
      contentToDisplay = (
        <div className="relative group">
          <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded-md overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(data, null, 2)}
          </pre>
          <button
            onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
            className="absolute top-2 right-2 p-1.5 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
            title="Copy JSON"
          >
            <FiCopy size={12} />
          </button>
        </div>
      );
    }
  } else if (typeof data === "string") {
    contentToDisplay = (
      <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
        {data}
      </p>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700/80 transition rounded-t-lg focus:outline-none"
      >
        <span className="font-medium text-sm text-gray-700 dark:text-gray-200 text-left">
          {title}
        </span>
        {isOpen ? <FiChevronUp /> : <FiChevronDown />}
      </button>
      {isOpen && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-600">
          {contentToDisplay || (
            <p className="text-sm italic text-gray-400 dark:text-gray-500">
              No additional data.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default StepCard;
