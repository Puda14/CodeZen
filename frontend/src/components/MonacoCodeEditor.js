"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useTheme } from "../context/ThemeContext";
import { handleFileUpload } from "../utils/fileUtils";
import { FiUpload } from "react-icons/fi";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-[400px] bg-gray-200 dark:bg-gray-700 rounded-md">
      <p>Loading Editor...</p>
    </div>
  ),
});

const MonacoCodeEditor = ({
  code,
  onChange: setCodeFromHook,
  language,
  setLanguage,
}) => {
  const { theme } = useTheme();

  const handleEditorChange = (value, event) => {
    if (setCodeFromHook) {
      setCodeFromHook(value);
    }
  };

  const onFileChange = async (e) => {
    try {
      await handleFileUpload(e, setCodeFromHook);
      e.target.value = null;
    } catch (error) {
      console.error("Error handling file upload:", error);
    }
  };

  return (
    <div className="p-1 w-full">
      <div className="mb-2 flex justify-start items-center">
        <label
          htmlFor="language-select"
          className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Language:
        </label>
        <select
          id="language-select"
          aria-label="Select Language"
          className="w-auto p-2 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="cpp">C++</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="rust">Rust</option>
          <option value="go">Go</option>
        </select>
      </div>

      <div className="border rounded-md overflow-hidden mb-4">
        <MonacoEditor
          height="50vh"
          theme={theme === "dark" ? "vs-dark" : "vs-light"}
          language={language}
          value={code}
          onChange={handleEditorChange}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            wordWrap: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            glyphMargin: true,
            folding: true,
            lineNumbers: "on",
          }}
        />
      </div>

      <div>
        <label
          htmlFor="code-upload"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
        >
          <FiUpload size={14} /> Upload File
        </label>
        <input
          id="code-upload"
          type="file"
          accept=".txt,.cpp,.py,.js,.java,.go,.rs"
          className="sr-only"
          onChange={onFileChange}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Or drag and drop your file here.
        </p>
      </div>
    </div>
  );
};

export default MonacoCodeEditor;
