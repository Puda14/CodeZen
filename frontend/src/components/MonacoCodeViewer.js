"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useTheme } from "@/context/ThemeContext";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center min-h-[150px] bg-gray-100 dark:bg-gray-700 rounded-md text-gray-600 dark:text-gray-400 text-sm">
      Loading Code...
    </div>
  ),
});

const MonacoCodeViewer = ({
  value,
  language,
  height = "200px",
  options = {},
}) => {
  const { theme } = useTheme();

  const defaultOptions = {
    readOnly: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 13,
    wordWrap: "on",
    automaticLayout: true,
    contextmenu: false,
    scrollbar: {
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
  };

  const editorOptions = { ...defaultOptions, ...options };

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden shadow-sm">
      <MonacoEditor
        height={height}
        language={language?.toLowerCase()}
        value={value || ""}
        theme={theme === "dark" ? "vs-dark" : "vs"}
        options={editorOptions}
      />
    </div>
  );
};

export default MonacoCodeViewer;
