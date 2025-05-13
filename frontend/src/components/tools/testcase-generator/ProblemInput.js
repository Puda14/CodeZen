"use client";

import React from "react";
import MarkdownEditorWithPreview from "@/components/common/MarkdownEditorWithPreview";

const ProblemInput = ({ value, onChange, isDisabled, minHeight = "100vh" }) => {
  return (
    <div className="h-full flex flex-col">
      <label
        htmlFor="problemDescription"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        Problem Description (Markdown)
      </label>
      <MarkdownEditorWithPreview
        value={value}
        onChange={onChange}
        minHeight={minHeight}
        isDisabled={isDisabled}
      />
    </div>
  );
};

export default ProblemInput;
