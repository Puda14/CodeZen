"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useTheme } from "../context/ThemeContext";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
      <p>Loading Editor...</p>
    </div>
  ),
});

export default function InputOutput({ inputData, setInputData, output }) {
  const { theme } = useTheme();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mt-6">
      <div>
        <label
          htmlFor="input-editor"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Input
        </label>
        <div id="input-editor" className="border rounded-md overflow-hidden">
          <MonacoEditor
            height="200px"
            theme={theme === "dark" ? "vs-dark" : "vs-light"}
            language="plaintext"
            value={inputData}
            onChange={(value) => setInputData(value)}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              readOnly: false,
              lineNumbers: "off",
              glyphMargin: false,
            }}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="output-editor"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Output
        </label>
        <div id="output-editor" className="border rounded-md overflow-hidden">
          <MonacoEditor
            height="200px"
            theme={theme === "dark" ? "vs-dark" : "vs-light"}
            language="plaintext"
            value={output ?? ""}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              readOnly: true,
              lineNumbers: "off",
              glyphMargin: false,
            }}
          />
        </div>
      </div>
    </div>
  );
}
