"use client";

import React from "react";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

export default function InputOutput({ inputData, setInputData, output }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl mx-auto mt-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Input
        </label>
        <div className="mt-2 border rounded-md">
          <MonacoEditor
            height="200px"
            theme="vs-dark"
            language="plaintext"
            value={inputData}
            onChange={setInputData}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              wordWrap: "on",
              automaticLayout: true,
            }}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Output
        </label>
        <div className="mt-2 border rounded-md">
          <MonacoEditor
            height="200px"
            theme="vs-dark"
            language="plaintext"
            value={output}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              wordWrap: "on",
              automaticLayout: true,
              readOnly: true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
