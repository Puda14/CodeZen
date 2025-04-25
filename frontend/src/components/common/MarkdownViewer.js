"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";

const MarkdownViewer = ({ value }) => {
  const contentToRender = value?.trim() ? value : "_No content provided._";

  return (
    <div className="markdown-body p-4 bg-gray-100 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
      >
        {contentToRender}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownViewer;
