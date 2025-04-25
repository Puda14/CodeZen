"use client";

import React from "react";
import { FiGlobe, FiCheckSquare, FiSquare, FiTrash2 } from "react-icons/fi";

/**
 * Renders a single testcase item, supporting view, edit, and delete selection modes.
 * @param {object} testcase - The testcase data object.
 * @param {number} index - The index of the testcase in the list.
 * @param {boolean} isEditing - True if the parent is in edit mode for this item's fields.
 * @param {boolean} isSaving - True if the parent is currently saving edits (disables inputs).
 * @param {function} onChange - Callback(index, field, value) for input changes during edit.
 * @param {boolean} isDeleteMode - True if the parent is in delete selection mode.
 * @param {boolean} isSelected - True if this testcase is selected for deletion.
 * @param {function} onSelect - Callback(testcaseId) when the delete checkbox is toggled.
 */
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
    const handleIsPublicChange = (e) =>
      handleFieldChange("isPublic", e.target.value);
    const handleInputChange = (e) => handleFieldChange("input", e.target.value);
    const handleOutputChange = (e) =>
      handleFieldChange("output", e.target.value);

    const isPublicValue =
      testcase.isPublic === true || testcase.isPublic === "true";
    const testcaseId = testcase._id || testcase.id;
    const keyId = testcaseId || `temp-${index}`;

    return (
      <div
        key={keyId}
        className={`relative rounded-lg border p-4 shadow-sm transition-colors duration-150 ${
          isEditing
            ? "bg-gray-100 dark:bg-gray-700/80 border-gray-300 dark:border-gray-600"
            : "bg-gray-50 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700"
        } ${isDeleteMode ? "border-blue-400 dark:border-blue-600" : ""} ${
          isSelected ? "bg-blue-50 dark:bg-blue-900/50 border-blue-500" : ""
        }`}
      >
        {isDeleteMode && testcaseId && (
          <div className="absolute top-3 left-3 z-10">
            <label
              htmlFor={`select-tc-${keyId}`}
              className="flex cursor-pointer items-center p-1"
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
                  className="text-blue-600 dark:text-blue-400"
                  size={18}
                />
              ) : (
                <FiSquare
                  className="text-gray-400 dark:text-gray-500"
                  size={18}
                />
              )}
            </label>
          </div>
        )}

        <div className={isDeleteMode ? "pl-8" : ""}>
          <div className="mb-3 flex items-center justify-between border-b pb-2 dark:border-gray-600">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              <span>#{index + 1}</span>
              <span className="text-gray-400 dark:text-gray-500">|</span>
              <span
                className={` ${
                  Number(testcase.score) >= 100
                    ? "text-green-600 dark:text-green-400"
                    : "text-yellow-600 dark:text-yellow-400"
                }`}
              >
                Score:{" "}
                {isEditing ? (
                  <input
                    type="number"
                    value={testcase.score ?? ""}
                    onChange={handleScoreChange}
                    className="w-20 rounded border border-gray-300 bg-white p-1 text-sm outline-none disabled:opacity-70 dark:border-gray-500 dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={isSaving}
                    min="0"
                  />
                ) : (
                  <span className="font-semibold">
                    {testcase.score ?? "N/A"}
                  </span>
                )}
              </span>
              <span className="text-gray-400 dark:text-gray-500">|</span>
              <span
                className={`font-medium ${
                  isPublicValue
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {isEditing ? (
                  <>
                    <FiGlobe
                      className={`mr-1 inline ${
                        isPublicValue ? "text-green-500" : "text-gray-500"
                      }`}
                      aria-hidden="true"
                    />
                    <select
                      value={String(testcase.isPublic)}
                      onChange={handleIsPublicChange}
                      className="rounded border border-gray-300 bg-white p-1 text-sm outline-none disabled:opacity-70 dark:border-gray-500 dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      disabled={isSaving}
                    >
                      <option value="true">Public</option>
                      <option value="false">Private</option>
                    </select>
                  </>
                ) : isPublicValue ? (
                  "Public"
                ) : (
                  "Private"
                )}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                {" "}
                Input:{" "}
              </label>
              {isEditing ? (
                <textarea
                  value={testcase.input ?? ""}
                  onChange={handleInputChange}
                  className="h-32 w-full resize-y rounded border border-gray-300 p-2 font-mono text-xs text-gray-900 outline-none disabled:opacity-70 dark:border-gray-500 dark:bg-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  spellCheck="false"
                  disabled={isSaving}
                  style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
                />
              ) : (
                <pre
                  className="max-h-24 w-full overflow-auto rounded border border-gray-200 bg-white p-2 font-mono text-xs text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                  style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
                >
                  {testcase.input || (
                    <span className="italic text-gray-400">(empty)</span>
                  )}
                </pre>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                {" "}
                Output:{" "}
              </label>
              {isEditing ? (
                <textarea
                  value={testcase.output ?? ""}
                  onChange={handleOutputChange}
                  className="h-32 w-full resize-y rounded border border-gray-300 p-2 font-mono text-xs text-gray-900 outline-none disabled:opacity-70 dark:border-gray-500 dark:bg-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  spellCheck="false"
                  disabled={isSaving}
                  style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
                />
              ) : (
                <pre
                  className="max-h-24 w-full overflow-auto rounded border border-gray-200 bg-white p-2 font-mono text-xs text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                  style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
                >
                  {testcase.output || (
                    <span className="italic text-gray-400">(empty)</span>
                  )}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

SingleTestcase.displayName = "SingleTestcase";
export default SingleTestcase;
