"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useTheme } from "@/context/ThemeContext";

// Lazy load Monaco Editor as it's large and only needed client-side
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center bg-gray-100 p-4 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
      Loading Editor...
    </div>
  ),
});

/**
 * A component that provides a Markdown editor (using Monaco) and a live preview tab.
 * Uses ReactMarkdown with KaTeX for rendering.
 * @param {string} value - The current markdown string value.
 * @param {function} onChange - Callback function when the value changes in the editor, receives the new value string.
 * @param {boolean} [isDisabled=false] - Disables the editor input.
 * @param {string} [minHeight="500px"] - Minimum height for the editor and preview area (CSS value).
 */
const MarkdownEditorWithPreview = ({
  value,
  onChange,
  isDisabled = false,
  minHeight = "500px",
}) => {
  const [tab, setTab] = useState("preview");
  const { theme } = useTheme();

  const editorTheme = theme === "dark" ? "vs-dark" : "light";

  return (
    <div className="mt-1 w-full overflow-hidden rounded-md border border-gray-300 dark:border-gray-700">
      {/* Tab Buttons */}
      <div className="flex border-b border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800">
        <button
          type="button"
          onClick={() => setTab("edit")}
          disabled={isDisabled}
          className={`px-4 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-800 ${
            tab === "edit"
              ? "border-b-2 border-blue-500 bg-white text-blue-600 dark:bg-gray-700 dark:text-blue-400"
              : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          } ${isDisabled ? "cursor-not-allowed opacity-60" : ""}`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={`px-4 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-800 ${
            tab === "preview"
              ? "border-b-2 border-blue-500 bg-white text-blue-600 dark:bg-gray-700 dark:text-blue-400"
              : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          Preview
        </button>
      </div>

      {/* Content Area: Editor or Preview */}
      <div>
        {tab === "edit" ? (
          <MonacoEditor
            height={minHeight}
            language="markdown"
            value={value ?? ""}
            onChange={onChange}
            theme={editorTheme}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              wordWrap: "on",
              automaticLayout: true,
              readOnly: isDisabled,
              scrollbar: {
                vertical: "auto",
                horizontal: "auto",
              },
              padding: { top: 10, bottom: 10 },
            }}
          />
        ) : (
          <div
            className="markdown-body p-4 bg-gray-50 dark:bg-gray-800"
            style={{ minHeight: minHeight }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {value || "_Preview will appear here. Start editing!_"}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditorWithPreview;
