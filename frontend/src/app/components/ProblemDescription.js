import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export default function ProblemDescription({ problemDescription }) {
  return (
    <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
        Problem Description
      </h2>
      <div className="markdown-body bg-gray-100 dark:bg-gray-900 p-4 rounded-md border border-gray-300 dark:border-gray-700">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {problemDescription || "Loading problem description..."}
        </ReactMarkdown>
      </div>
    </div>
  );
}
