"use client";

import { useState, useEffect, useMemo } from "react";
import { FiPlus, FiTrash2, FiLoader } from "react-icons/fi";
import api from "@/utils/coreApi";
import { useToast } from "@/context/ToastProvider";
import Modal from "@/components/common/Modal";
import { testcaseTimeoutLimits } from "@/config/contestConfig";

const getInitialTestcaseState = () => ({
  input: "",
  output: "",
  score: 10,
  isPublic: false,
  timeout: testcaseTimeoutLimits.default,
});

const AddTestcaseRow = ({ testcase, index, onChange, onRemove, isSaving }) => {
  const handleFieldChange = (field, value) => {
    let processedValue = value;
    if (field === "score") {
      const numValue = parseInt(value, 10);
      processedValue = isNaN(numValue) || numValue < 0 ? 0 : numValue;
    } else if (field === "isPublic") {
      processedValue = value === "true";
    } else if (field === "timeout") {
      if (value !== "") {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue)) {
          return;
        }
        if (numValue < testcaseTimeoutLimits.min) {
          processedValue = testcaseTimeoutLimits.min;
        } else if (numValue > testcaseTimeoutLimits.max) {
          processedValue = testcaseTimeoutLimits.max;
        } else {
          processedValue = numValue;
        }
      }
    }
    onChange(index, field, processedValue);
  };

  return (
    <div className="p-3 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm relative">
      {index > 0 && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="absolute top-1 right-1 text-red-500 hover:text-red-700 disabled:opacity-50 p-1 z-10"
          disabled={isSaving}
          title="Remove this testcase row"
        >
          <FiTrash2 size={16} />
        </button>
      )}
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
        New Testcase #{index + 1}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
        <div>
          <label
            htmlFor={`modal-input-${index}`}
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Input: <span className="text-red-500">*</span>
          </label>
          <textarea
            id={`modal-input-${index}`}
            value={testcase.input || ""}
            onChange={(e) => handleFieldChange("input", e.target.value)}
            required
            rows={3}
            className="w-full p-1.5 border border-gray-300 dark:border-gray-500 rounded dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-xs h-32 resize-y focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-70"
            disabled={isSaving}
            placeholder="Testcase input"
          />
        </div>
        <div>
          <label
            htmlFor={`modal-output-${index}`}
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Output: <span className="text-red-500">*</span>
          </label>
          <textarea
            id={`modal-output-${index}`}
            value={testcase.output || ""}
            onChange={(e) => handleFieldChange("output", e.target.value)}
            required
            rows={3}
            className="w-full p-1.5 border border-gray-300 dark:border-gray-500 rounded dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-xs h-32 resize-y focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-70"
            disabled={isSaving}
            placeholder="Expected output"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
        <div>
          <label
            htmlFor={`modal-score-${index}`}
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Score: <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id={`modal-score-${index}`}
            value={testcase.score ?? 0}
            min="0"
            onChange={(e) => handleFieldChange("score", e.target.value)}
            required
            className="w-full border dark:bg-gray-800 border-gray-300 dark:border-gray-500 rounded p-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-70 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            disabled={isSaving}
            placeholder="Points"
          />
        </div>
        <div>
          <label
            htmlFor={`modal-timeout-${index}`}
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Timeout (s): <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id={`modal-timeout-${index}`}
            value={testcase.timeout ?? ""}
            min={testcaseTimeoutLimits.min}
            max={testcaseTimeoutLimits.max}
            step="1"
            onChange={(e) => handleFieldChange("timeout", e.target.value)}
            required
            className="w-full border dark:bg-gray-800 border-gray-300 dark:border-gray-500 rounded p-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-70 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            disabled={isSaving}
            placeholder={`${testcaseTimeoutLimits.min}-${testcaseTimeoutLimits.max}s`}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Range: {testcaseTimeoutLimits.min}s - {testcaseTimeoutLimits.max}s.
          </p>
        </div>
        <div>
          <label
            htmlFor={`modal-visibility-${index}`}
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Visibility:
          </label>
          <select
            id={`modal-visibility-${index}`}
            value={String(testcase.isPublic)}
            onChange={(e) => handleFieldChange("isPublic", e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-500 rounded p-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-70"
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

const AddTestcasesModal = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  contestId,
  problemId,
}) => {
  const toastContextValue = useToast();
  const toast = toastContextValue?.showToast;

  const [newTestcases, setNewTestcases] = useState([getInitialTestcaseState()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addRow = () => {
    setNewTestcases([...newTestcases, getInitialTestcaseState()]);
  };

  const removeRow = (indexToRemove) => {
    if (newTestcases.length <= 1) {
      toast?.("At least one testcase is required.", "warning");
      return;
    }
    setNewTestcases(newTestcases.filter((_, index) => index !== indexToRemove));
  };

  const updateRow = (index, field, value) => {
    setNewTestcases((current) =>
      current.map((tc, idx) => (idx === index ? { ...tc, [field]: value } : tc))
    );
  };

  const handleSubmit = async () => {
    if (newTestcases.some((tc) => !tc.input?.trim() || !tc.output?.trim())) {
      toast?.("All testcases must have non-empty input and output.", "error");
      return;
    }
    for (const [index, tc] of newTestcases.entries()) {
      const scoreVal = parseInt(String(tc.score), 10);
      if (isNaN(scoreVal) || scoreVal < 0) {
        toast?.(
          `Score for testcase #${index + 1} must be a non-negative number.`,
          "error"
        );
        return;
      }
      const timeoutStr = String(tc.timeout).trim();
      if (timeoutStr === "") {
        toast?.(`Timeout for testcase #${index + 1} cannot be empty.`, "error");
        return;
      }
      const timeoutVal = parseInt(timeoutStr, 10);
      if (
        isNaN(timeoutVal) ||
        timeoutVal < testcaseTimeoutLimits.min ||
        timeoutVal > testcaseTimeoutLimits.max
      ) {
        toast?.(
          `Timeout for testcase #${index + 1} must be a number between ${
            testcaseTimeoutLimits.min
          } and ${testcaseTimeoutLimits.max} seconds.`,
          "error"
        );
        return;
      }
    }

    setIsSubmitting(true);
    const payload = newTestcases.map((tc) => ({
      input: tc.input.trim(),
      output: tc.output.trim(),
      score: Number(tc.score) || 0,
      isPublic: tc.isPublic === true,
      timeout: parseInt(String(tc.timeout), 10),
    }));

    try {
      const apiUrl = `/contest/${contestId}/problems/${problemId}/testcases`;
      const response = await api.post(apiUrl, payload);
      if (response.data) {
        toast?.("Testcases added successfully!", "success");
        setNewTestcases([getInitialTestcaseState()]);
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
        onClose();
      } else {
        throw new Error(
          response.data?.message || "Failed to add testcases. No data returned."
        );
      }
    } catch (error) {
      console.error("Failed to add testcases:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "An unknown error occurred while adding testcases.";
      toast?.(`Failed to add testcases: ${errorMessage}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setNewTestcases([getInitialTestcaseState()]);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Testcases"
      maxWidthClass="max-w-4xl"
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {newTestcases.map((tc, index) => (
          <AddTestcaseRow
            key={`new-tc-${index}`}
            testcase={tc}
            index={index}
            onChange={updateRow}
            onRemove={removeRow}
            isSaving={isSubmitting}
          />
        ))}
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 mt-2 disabled:opacity-50"
          disabled={isSubmitting}
        >
          <FiPlus size={16} /> Add Another Testcase
        </button>
      </div>

      <div className="flex justify-end gap-3 pt-6 mt-4 border-t dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 dark:border-gray-500 rounded shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800 focus:ring-gray-400"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:opacity-50 flex items-center gap-2"
          disabled={isSubmitting || newTestcases.length === 0}
        >
          {isSubmitting && <FiLoader className="animate-spin h-4 w-4" />}
          {isSubmitting ? "Adding..." : "Add Testcases"}
        </button>
      </div>
    </Modal>
  );
};

export default AddTestcasesModal;
