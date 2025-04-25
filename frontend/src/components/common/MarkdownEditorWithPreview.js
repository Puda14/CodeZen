"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useTheme } from "@/context/ThemeContext";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const MarkdownEditorWithPreview = ({ value, onChange }) => {
  const [tab, setTab] = useState("preview");
  const { theme } = useTheme();

  return (
    <div className="w-full mt-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-300 dark:border-gray-600 mb-2">
        <button
          onClick={() => setTab("preview")}
          className={`px-4 py-2 text-sm font-medium focus:outline-none ${
            tab === "preview"
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setTab("edit")}
          className={`px-4 py-2 text-sm font-medium focus:outline-none ${
            tab === "edit"
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          Edit
        </button>
      </div>

      {/* Content */}
      <div className="border rounded-md dark:border-gray-700">
        {tab === "edit" ? (
          <MonacoEditor
            height="400px"
            language="markdown"
            value={value}
            onChange={onChange}
            theme={theme === "dark" ? "vs-dark" : "vs-light"}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              wordWrap: "on",
              automaticLayout: true,
            }}
          />
        ) : (
          <div className="prose dark:prose-invert max-w-none p-4 bg-gray-100 dark:bg-gray-800 rounded">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {value || "No content available."}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditorWithPreview;
