"use client";

import { useState } from "react";

export default function ExecutePage() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [inputData, setInputData] = useState("");
  const [output, setOutput] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0]; // Get the selected file
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCode(e.target.result); // Set the file content as the code
      };
      reader.readAsText(file); // Read the file as text
    }
  };

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">
        Execute Code
      </h1>
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
        {/* Code Input */}
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
        {/* Upload File */}
        <div>
          <label
            htmlFor="fileUpload"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Upload File
          </label>
          <input
            id="fileUpload"
            type="file"
            accept=".txt,.cpp,.py" // Accept only text, C++, or Python files
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

        {/* Execute Button */}
        <div className="flex justify-end">
          <button
            onClick={handleExecute}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-500"
          >
            Execute
          </button>
        </div>
      </div>
    </div>
  );
}
