"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw"; // Allow raw HTML
import rehypeHighlight from "rehype-highlight"; // Syntax highlighting for code blocks
import rehypeMathjax from "rehype-mathjax"; // Render LaTeX math expressions
import "katex/dist/katex.min.css"; // Include KaTeX styles for LaTeX rendering
import "github-markdown-css"; // GitHub-style Markdown CSS
import "highlight.js/styles/github.css"; // GitHub-style syntax highlighting

export default function ProblemPage() {
  const [problemDescription, setProblemDescription] = useState(""); // Markdown content state
  const [language, setLanguage] = useState("cpp"); // Default language C++
  const [code, setCode] = useState(""); // Code input state
  const [inputData, setInputData] = useState(""); // Input data state
  const [output, setOutput] = useState(""); // Output state
  const [testcaseResults, setTestcaseResults] = useState(null); // Testcase results state
  const [isLoading, setIsLoading] = useState(false); // Loading state for test case checking

  // Load Markdown File
  useEffect(() => {
    fetch("/test.md") // Fetch Markdown file from the public folder
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load problem description: ${response.status}`);
        }
        return response.text(); // Convert file content to text
      })
      .then((data) => setProblemDescription(data)) // Store Markdown content in state
      .catch((error) => console.error("Error loading problem description:", error));
  }, []);

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setCode(e.target.result); // Set the content of the file to the code input
    };
    reader.readAsText(file); // Read file as text
  };

  // Function to execute code
  const handleExecute = async () => {
    const payload = {
      processor: language,
      code: code,
      input_data: inputData,
    };

    try {
      const response = await fetch("http://localhost:8080/api/code-manager/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setOutput(data.result.output || data.result.error_message || "Execution successful but no result returned.");
    } catch (error) {
      console.error("Execution failed:", error);
      setOutput("Error executing code. Check your input or server connection.");
    }
  };

  // Function to check test cases
  const handleCheckTestcase = async () => {
    setIsLoading(true); // Start loading
    const payload = {
      processor: language,
      code: code,
      input_data: inputData,
    };

    try {
      const response = await fetch("http://localhost:8080/api/code-manager/testcase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setTestcaseResults(data.result); // Store results and summary in state
    } catch (error) {
      console.error("Testcase check failed:", error);
      setTestcaseResults(null);
    } finally {
      setIsLoading(false); // End loading
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">
        Problem Page
      </h1>

      {/* Problem Description */}
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Problem Description</h2>
        <div className="markdown-body bg-gray-100 dark:bg-gray-900 p-4 rounded-md border border-gray-300 dark:border-gray-700">
          <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeMathjax]}>
            {problemDescription || "Loading problem description..."}
          </ReactMarkdown>
        </div>
      </div>

      {/* Code Input */}
      <div className="mt-10 w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
        <div>
          <label
            htmlFor="code"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Code
          </label>
          <textarea
            id="code"
            rows="8"
            className="mt-2 w-full p-3 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 focus:outline-none focus:ring focus:ring-blue-500"
            placeholder="Write your code here..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
          ></textarea>

          {/* File Upload */}
          <div className="mt-4">
            <label
              htmlFor="fileUpload"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Upload Code File
            </label>
            <input
              id="fileUpload"
              type="file"
              accept=".txt,.cpp,.py"
              className="mt-2 block w-full text-sm text-gray-900 dark:text-gray-200 dark:bg-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
              onChange={handleFileUpload}
            />
          </div>

          {/* Language Selector */}
          <div className="mt-4">
            <label
              htmlFor="language"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Select Language
            </label>
            <select
              id="language"
              className="mt-2 w-1/2 p-3 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 focus:outline-none focus:ring focus:ring-blue-500"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="python">Python</option>
              <option value="cpp">C++</option>
            </select>
          </div>
        </div>

        {/* Input and Output */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="input"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Input
            </label>
            <textarea
              id="input"
              rows="4"
              className="mt-2 w-full p-3 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 focus:outline-none focus:ring focus:ring-blue-500"
              placeholder="Enter input data..."
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
            ></textarea>
          </div>
          <div>
            <label
              htmlFor="output"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Output
            </label>
            <textarea
              id="output"
              rows="4"
              className="mt-2 w-full p-3 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 focus:outline-none focus:ring focus:ring-blue-500"
              placeholder="Output will be displayed here..."
              value={output}
              readOnly
            ></textarea>
          </div>
        </div>

        {/* Execute and Check Testcase Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleExecute}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-500"
          >
            Execute
          </button>
          <button
            onClick={handleCheckTestcase}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded hover:bg-green-700 focus:outline-none focus:ring focus:ring-green-500"
          >
            {isLoading ? "Checking..." : "Check Testcase"}
          </button>
        </div>

        {/* Testcase Results */}
        {isLoading && (
          <div className="mt-6 text-lg text-center text-gray-700 dark:text-gray-300">
            Checking test cases...
          </div>
        )}
        {!isLoading && testcaseResults && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Testcase Results</h3>
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md border border-gray-300 dark:border-gray-700">
              <ul>
                {testcaseResults.results.map((test, index) => (
                  <li key={index} className="mb-2">
                    <span className="font-semibold">Testcase {test.test_case}:</span>{" "}
                    <span
                      className={`font-semibold ${
                        test.status === "passed" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {test.status}
                    </span>{" "}
                    {/* - Output: {test.output} */}
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Summary: {testcaseResults.summary.passed} Passed / {testcaseResults.summary.failed} Failed /{" "}
                  {testcaseResults.summary.total} Total
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
