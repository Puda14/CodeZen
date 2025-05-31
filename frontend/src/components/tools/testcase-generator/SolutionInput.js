"use client";

import React, { useRef } from "react";
import MonacoEditor from "@monaco-editor/react";
import { useTheme } from "@/context/ThemeContext";
import { supportedProcessors } from "@/config/processorConfig";
import { FiUpload } from "react-icons/fi";

const SolutionInput = ({
  codeValue,
  onCodeChange,
  processorValue,
  onProcessorChange,
  isDisabled,
  currentLanguage,
}) => {
  const { theme } = useTheme();
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        onCodeChange(content);
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow flex flex-col min-h-[200px]">
        <div className="flex justify-between items-center mb-1">
          <label
            htmlFor="solutionCode"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0"
          >
            Solution Code
          </label>
        </div>
        <div className="border rounded-md overflow-hidden border-gray-300 dark:border-gray-600 flex-grow relative min-h-0">
          <MonacoEditor
            language={currentLanguage || "plaintext"}
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
        <div className="mb-2">
          {!isDisabled && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".txt,.js,.py,.java,.c,.cpp,.go,.rs,.ts,.cs,.php,.rb,.kt,.swift"
              />
              <button
                type="button"
                onClick={triggerFileUpload}
                disabled={isDisabled}
                className="text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
              >
                <FiUpload size={12} />
                Upload File
              </button>
            </>
          )}
        </div>
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
