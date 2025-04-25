// src/components/contest/owner/problem/NewTestcaseInput.js
"use client";

import React from "react";
import { FiTrash2 } from "react-icons/fi";

/**
 * Input group for a single testcase within creation or edit forms.
 * @param {object} testcase - The testcase data object.
 * @param {number} index - The index of this testcase.
 * @param {function} onChange - Callback(index, field, value) for input changes.
 * @param {function} onRemove - Callback(index) to remove this testcase.
 * @param {boolean} isSaving - Disables inputs during save operations.
 */
const NewTestcaseInput = ({
  testcase,
  index,
  onChange,
  onRemove,
  isSaving,
}) => {
  const handleFieldChange = (field, value) => {
    onChange(index, field, value);
  };

  return (
    <div className="p-3 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 space-y-2 relative">
      {typeof onRemove === 'function' && (
         <button
           type="button"
           onClick={() => onRemove(index)}
           className="absolute top-1 right-1 text-red-500 hover:text-red-700 disabled:opacity-50 p-1"
           disabled={isSaving}
           title="Remove testcase"
           aria-label={`Remove testcase ${index + 1}`}
         >
           <FiTrash2 size={16} />
         </button>
      )}
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
        Testcase #{index + 1}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Input: <span className="text-red-500">*</span>
          </label>
          <textarea
            value={testcase.input ?? ''}
            onChange={(e) => handleFieldChange("input", e.target.value)}
            required
            className="w-full p-1.5 border border-gray-300 dark:border-gray-500 rounded dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-xs h-40 resize-y focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-70"
            disabled={isSaving}
            rows={5}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Output: <span className="text-red-500">*</span>
          </label>
          <textarea
            value={testcase.output ?? ''}
            onChange={(e) => handleFieldChange("output", e.target.value)}
            required
            className="w-full p-1.5 border border-gray-300 dark:border-gray-500 rounded dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-xs h-40 resize-y focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-70"
            disabled={isSaving}
            rows={5}
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Score: <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={testcase.score ?? ''}
            min="0"
            onChange={(e) => handleFieldChange("score", e.target.value)}
            required
            className="border dark:bg-gray-800 border-gray-300 dark:border-gray-500 rounded p-1 text-sm w-20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-70"
            disabled={isSaving}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Visibility:
          </label>
          <select
            value={String(testcase.isPublic ?? 'false')}
            onChange={(e) => handleFieldChange("isPublic", e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-500 rounded p-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-70"
            disabled={isSaving}
          >
            <option value="true">Public</option>
            <option value="false">Private</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default NewTestcaseInput;
