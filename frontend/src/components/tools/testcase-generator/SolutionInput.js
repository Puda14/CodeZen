"use client";

import React from "react";
import MonacoEditor from "@monaco-editor/react";
import { useTheme } from "@/context/ThemeContext";
import { supportedProcessors } from "@/config/processorConfig";

const SolutionInput = ({
  codeValue,
  onCodeChange,
  processorValue,
  onProcessorChange,
  isDisabled,
  currentLanguage,
}) => {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow flex flex-col min-h-[200px]">
        <label
          htmlFor="solutionCode"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex-shrink-0"
        >
          Solution Code
        </label>
        <div className="border rounded-md overflow-hidden border-gray-300 dark:border-gray-600 flex-grow relative">
          <MonacoEditor
            language={currentLanguage || "plaintext"} // Đã sử dụng đúng 'language'
            value={codeValue}
            onChange={(value) => onCodeChange(value || "")}
            theme={theme === "dark" ? "vs-dark" : "vs-light"}
            options={{
              minimap: { enabled: false },
              readOnly: isDisabled,
              fontSize: 13,
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex-shrink-0">
        <label
          htmlFor="processor"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Processor / Language Version
        </label>
        <select
          id="processor"
          value={processorValue}
          onChange={(e) => onProcessorChange(e.target.value)}
          disabled={isDisabled}
          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          {Object.entries(supportedProcessors).map(([key, value]) => (
            <option key={key} value={value.processor}>
              {value.processor} ({value.language})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SolutionInput;
