"use client";

import React from "react";
import { FiPlay, FiLoader } from "react-icons/fi";

const GenerationControls = ({ onGenerate, isGenerating }) => {
  return (
    <button
      onClick={onGenerate}
      disabled={isGenerating}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 mt-4"
    >
      {isGenerating ? (
        <FiLoader className="animate-spin h-5 w-5" />
      ) : (
        <FiPlay className="h-5 w-5" />
      )}
      {isGenerating ? "Generating Test Cases..." : "Start Generation"}
    </button>
  );
};

export default GenerationControls;
