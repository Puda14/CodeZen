"use client";

import React, { useState } from "react";
import GeneratedTestcaseCard from "./GeneratedTestcaseCard";
import { FiCopy, FiFileText, FiDownload } from "react-icons/fi";
import { useToast } from "@/context/ToastProvider";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const SynthesizedTestcasesDisplay = ({ testcases }) => {
  const { showToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!testcases || testcases.length === 0) {
    return null;
  }

  const validTestcases = testcases.filter(
    (tc) => tc && typeof tc === "object" && tc.input !== undefined
  );

  const handleDownloadZip = async () => {
    if (validTestcases.length === 0) {
      showToast("No testcase codes available to download.", "warning");
      return;
    }

    setIsDownloading(true);
    const zip = new JSZip();

    validTestcases.forEach((tc, index) => {
      const filename = `t${String(index).padStart(2, "0")}.cpp`;
      zip.file(filename, tc.input);
    });

    try {
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "gen_testcases.zip");
      showToast("Testcases ZIP downloaded successfully!", "success");
    } catch (error) {
      showToast(
        "Failed to generate ZIP file. Check console for details.",
        "error"
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyAll = () => {
    if (validTestcases.length === 0) {
      showToast("No content to copy.", "warning");
      return;
    }
    const allInputs = validTestcases
      .map(
        (tc, i) =>
          `--- Test Case ${i + 1} (${tc.category || "N/A"}) ---\n${
            tc.explanation ? `Explanation: ${tc.explanation}\n` : ""
          }\nInput (Code):\n${tc.input}\n-------------------------\n`
      )
      .join("\n\n");
    navigator.clipboard
      .writeText(allInputs)
      .then(() => {
        showToast("All synthesized codes & explanations copied!", "success");
      })
      .catch((err) => {
        showToast("Failed to copy all codes.", "error");
      });
  };

  return (
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
        <FiFileText /> Synthesized Test Cases ({testcases.length})
      </h3>
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 border-l-2 border-green-200 dark:border-green-800 pl-3 py-1">
        {testcases
          .filter((tc) => tc && typeof tc === "object")
          .map((tc, index) => (
            <GeneratedTestcaseCard
              key={`synthesized-tc-${index}-${tc?.category || index}`}
              testcase={tc}
              index={index}
            />
          ))}
      </div>
      <div className="mt-4 flex justify-end space-x-2">
        <button
          onClick={handleDownloadZip}
          disabled={isDownloading}
          className="text-xs px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-md inline-flex items-center shadow transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Download all generated C++ codes as a ZIP file"
        >
          <FiDownload className="mr-1.5" />
          {isDownloading ? "Downloading..." : "Download ZIP"}
        </button>
        <button
          onClick={handleCopyAll}
          className="text-xs px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md inline-flex items-center shadow"
        >
          <FiCopy className="mr-1.5" /> Copy All Inputs & Explanations
        </button>
      </div>
    </div>
  );
};

export default SynthesizedTestcasesDisplay;
