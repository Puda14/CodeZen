"use client";

import React from "react";
import { FiGlobe, FiCheckSquare, FiSquare } from "react-icons/fi";
import { testcaseTimeoutLimits } from "@/config/contestConfig";

const SingleTestcase = React.memo(
  ({
    testcase,
    index,
    isEditing,
    isSaving,
    onChange,
    isDeleteMode,
    isSelected,
    onSelect,
  }) => {
    const handleFieldChange = (field, value) => {
      onChange(index, field, value);
    };

    const handleScoreChange = (e) => handleFieldChange("score", e.target.value);
    const handleTimeoutChange = (e) =>
      handleFieldChange("timeout", e.target.value);
    const handleIsPublicChange = (e) =>
      handleFieldChange("isPublic", e.target.value);
    const handleInputChange = (e) => handleFieldChange("input", e.target.value);
    const handleOutputChange = (e) =>
      handleFieldChange("output", e.target.value);

    const isPublicValue =
      testcase.isPublic === true || String(testcase.isPublic) === "true";
    const testcaseId = testcase._id || testcase.id;
    const keyId = testcaseId || `temp-${index}`;

    const cardBaseClasses =
      "relative rounded-lg border p-4 shadow-md transition-all duration-200 ease-in-out";
    const cardDefaultClasses =
      "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";
    const cardEditingClasses =
      "bg-blue-50 dark:bg-blue-900/60 border-blue-400 dark:border-blue-600 ring-1 ring-blue-400 dark:ring-blue-600";
    const cardDeleteHoverClasses =
      isDeleteMode && !isSelected
        ? "hover:border-red-500 dark:hover:border-red-600"
        : "";
    const cardDeleteSelectedClasses =
      isDeleteMode && isSelected
        ? "bg-red-100 dark:bg-red-900/60 border-red-500 dark:border-red-600 ring-2 ring-red-500 dark:ring-red-600"
        : "";
    const cardClasses = `${cardBaseClasses} ${
      isEditing ? cardEditingClasses : cardDefaultClasses
    } ${cardDeleteHoverClasses} ${cardDeleteSelectedClasses}`;

    const inputBaseClasses =
      "w-full rounded-md border p-2 text-sm outline-none transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed";
    const inputLightClasses =
      "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50";
    const inputDarkClasses =
      "dark:bg-gray-700 dark:border-gray-500 dark:text-gray-50 dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400/50";
    const formElementClasses = `${inputBaseClasses} ${inputLightClasses} ${inputDarkClasses}`;

    const textareaClasses = `${formElementClasses} h-32 resize-y font-mono text-xs`;
    const numberInputClasses = `${formElementClasses} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;
    const selectInputClasses = `${formElementClasses}`;

    const scoreColor = "text-orange-600 dark:text-orange-400";
    const timeoutColor = "text-teal-600 dark:text-teal-400";
    const publicColor = "text-emerald-600 dark:text-emerald-400";
    const privateColor = "text-rose-600 dark:text-rose-400";

    return (
      <div key={keyId} className={cardClasses}>
        {isDeleteMode && testcaseId && (
          <div className="absolute top-3 left-3 z-10">
            <label
              htmlFor={`select-tc-${keyId}`}
              className="flex cursor-pointer items-center p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/60"
              title={isSelected ? "Bỏ chọn để xóa" : "Chọn để xóa"}
            >
              <input
                id={`select-tc-${keyId}`}
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(testcaseId)}
                className="absolute h-0 w-0 opacity-0"
              />
              {isSelected ? (
                <FiCheckSquare
                  className="text-red-500 dark:text-red-400"
                  size={20}
                />
              ) : (
                <FiSquare
                  className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                  size={20}
                />
              )}
            </label>
          </div>
        )}

        <div className={isDeleteMode && testcaseId ? "pl-12" : ""}>
          <div className="mb-3 flex items-center justify-between border-b pb-2 dark:border-gray-600">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              <span>Testcase #{index + 1}</span>
              {!isEditing && (
                <>
                  <span className="text-gray-400 dark:text-gray-500">|</span>
                  <span>
                    Score:{" "}
                    <span className={`font-semibold ${scoreColor}`}>
                      {testcase.score ?? "N/A"}
                    </span>
                  </span>
                  <span className="text-gray-400 dark:text-gray-500">|</span>
                  <span>
                    Timeout:{" "}
                    <span className={`font-semibold ${timeoutColor}`}>
                      {testcase.timeout ?? testcaseTimeoutLimits.default}s
                    </span>
                  </span>
                  <span className="text-gray-400 dark:text-gray-500">|</span>
                  <span
                    className={`font-semibold ${
                      isPublicValue ? publicColor : privateColor
                    }`}
                  >
                    {isPublicValue ? "Public" : "Private"}
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-3">
            <div>
              <label
                htmlFor={`single-tc-input-${keyId}`}
                className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300"
              >
                Input:
              </label>
              {isEditing ? (
                <textarea
                  id={`single-tc-input-${keyId}`}
                  value={testcase.input ?? ""}
                  onChange={handleInputChange}
                  className={textareaClasses}
                  spellCheck="false"
                  disabled={isSaving}
                  placeholder="Testcase input"
                />
              ) : (
                <pre
                  className="max-h-32 w-full overflow-auto rounded-md border bg-gray-100 p-2.5 font-mono text-xs text-gray-800 dark:border-gray-600 dark:bg-gray-700/60 dark:text-gray-200 shadow-inner"
                  style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
                >
                  {testcase.input || (
                    <span className="italic text-gray-500 dark:text-gray-400">
                      (empty)
                    </span>
                  )}
                </pre>
              )}
            </div>
            <div>
              <label
                htmlFor={`single-tc-output-${keyId}`}
                className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300"
              >
                Output:
              </label>
              {isEditing ? (
                <textarea
                  id={`single-tc-output-${keyId}`}
                  value={testcase.output ?? ""}
                  onChange={handleOutputChange}
                  className={textareaClasses}
                  spellCheck="false"
                  disabled={isSaving}
                  placeholder="Expected output"
                />
              ) : (
                <pre
                  className="max-h-32 w-full overflow-auto rounded-md border bg-gray-100 p-2.5 font-mono text-xs text-gray-800 dark:border-gray-600 dark:bg-gray-700/60 dark:text-gray-200 shadow-inner"
                  style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
                >
                  {testcase.output || (
                    <span className="italic text-gray-500 dark:text-gray-400">
                      (empty)
                    </span>
                  )}
                </pre>
              )}
            </div>
          </div>
          {isEditing && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start pt-3 border-t dark:border-gray-500 mt-4">
              <div>
                <label
                  htmlFor={`single-tc-score-${keyId}`}
                  className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1"
                >
                  Score <span className="text-red-500">*</span>
                </label>
                <input
                  id={`single-tc-score-${keyId}`}
                  type="number"
                  value={testcase.score ?? 0}
                  onChange={handleScoreChange}
                  className={numberInputClasses}
                  disabled={isSaving}
                  min="0"
                  placeholder="Points"
                />
              </div>
              <div>
                <label
                  htmlFor={`single-tc-timeout-${keyId}`}
                  className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1"
                >
                  Timeout (s) <span className="text-red-500">*</span>
                </label>
                <input
                  id={`single-tc-timeout-${keyId}`}
                  type="number"
                  value={testcase.timeout ?? ""}
                  onChange={handleTimeoutChange}
                  min={testcaseTimeoutLimits.min}
                  max={testcaseTimeoutLimits.max}
                  step="1"
                  className={numberInputClasses}
                  disabled={isSaving}
                  placeholder={`${testcaseTimeoutLimits.min}-${testcaseTimeoutLimits.max}s`}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Range: {testcaseTimeoutLimits.min}s -{" "}
                  {testcaseTimeoutLimits.max}s.
                </p>
              </div>
              <div>
                <label
                  htmlFor={`single-tc-visibility-${keyId}`}
                  className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1"
                >
                  Visibility
                </label>
                <select
                  id={`single-tc-visibility-${keyId}`}
                  value={String(isPublicValue)}
                  onChange={handleIsPublicChange}
                  className={selectInputClasses}
                  disabled={isSaving}
                >
                  <option value="true">Public</option>
                  <option value="false">Private</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

SingleTestcase.displayName = "SingleTestcase";
export default SingleTestcase;
