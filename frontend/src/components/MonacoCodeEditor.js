"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useTheme } from "../context/ThemeContext";
import { handleFileUpload } from "../utils/fileUtils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const MonacoCodeEditor = ({ code, setCode, language, setLanguage }) => {
  const { theme } = useTheme();

  return (
    <div className="p-4 w-full max-w-4xl mx-auto">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Select language:
      </label>
      <select
        className="mt-2 w-1/4 p-2 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 focus:outline-none focus:ring focus:ring-blue-500"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="cpp">C++</option>
        <option value="java">Java</option>
        <option value="rust">Rust</option>
        <option value="go">Go</option>
      </select>

      <div className="mt-4 border rounded-md">
        <MonacoEditor
          height="400px"
          theme={theme === "dark" ? "vs-dark" : "vs-light"}
          language={language}
          value={code}
          onChange={setCode}
          options={{
            fontSize: 14,
            minimap: { enabled: true },
            wordWrap: "on",
            automaticLayout: true,
          }}
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Upload source file
        </label>
        <input
          type="file"
          accept=".txt,.cpp,.py,.js,.java,.go,.rs"
          className="mt-2 block w-full text-sm text-gray-900 dark:text-gray-200 dark:bg-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
          onChange={(e) => handleFileUpload(e, setCode)}
        />
      </div>
    </div>
  );
};

export default MonacoCodeEditor;
