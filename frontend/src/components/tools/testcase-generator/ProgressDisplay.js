"use client";

import React from "react";
import StepCard from "./StepCard";
import { FiActivity, FiAlertCircle, FiLoader } from "react-icons/fi";

const ProgressDisplay = ({ steps, apiError, getStepTitle, isGenerating }) => {
  return (
    <div className="space-y-4 p-4 md:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
        <FiActivity /> Generation Progress
      </h2>
      {apiError && (
        <div className="p-3 bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300 rounded-md text-sm flex items-center shadow">
          <FiAlertCircle className="mr-2 flex-shrink-0" /> {apiError}
        </div>
      )}
      <div className="space-y-2 max-h-[calc(100vh-28rem)] md:max-h-[calc(100vh-25rem)] overflow-y-auto pr-2 border-l-2 border-blue-200 dark:border-blue-800 pl-3 py-1">
        {steps.length === 0 && !isGenerating && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic py-4 text-center">
            Generated steps will appear here.
          </p>
        )}
        {steps.length === 0 && isGenerating && (
          <div className="flex justify-center items-center py-4">
            <FiLoader className="animate-spin text-blue-500 text-2xl" />
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              Waiting for first step...
            </span>
          </div>
        )}
        {steps.map((step) => (
          <StepCard
            key={step.id}
            title={getStepTitle(step)}
            data={step.payload.data || step.payload.status || step.payload}
            isInitiallyOpen={
              step.payload.step === "generate_cases" ||
              step.payload.step === "analyze_problem" ||
              step.payload.step === "analyze_code" ||
              step.payload.status === "starting" ||
              step.payload.status === "done"
            }
          />
        ))}
      </div>
    </div>
  );
};

export default ProgressDisplay;
