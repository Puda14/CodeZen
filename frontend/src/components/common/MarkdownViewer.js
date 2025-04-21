"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const MarkdownViewer = ({ value }) => {
  return (
    <div className="prose dark:prose-invert max-w-none p-4 bg-gray-100 dark:bg-gray-800 rounded">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {value || "No content available."}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownViewer;
