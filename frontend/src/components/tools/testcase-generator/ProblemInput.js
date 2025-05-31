"use client";

import React from "react";
import MarkdownEditorWithPreview from "@/components/common/MarkdownEditorWithPreview";

const ProblemInput = ({ value, onChange, isDisabled, minHeight = "800px" }) => {
  return (
    <div className="h-full flex flex-col">
      <label
        htmlFor="problemDescription"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex-shrink-0"
      >
        Problem Description (Markdown)
      </label>
      <div className="flex-grow min-h-0 relative">
        <MarkdownEditorWithPreview
          value={value}
          onChange={onChange}
          minHeight={minHeight}
          isDisabled={isDisabled}
        />
      </div>
    </div>
  );
};

export default ProblemInput;
