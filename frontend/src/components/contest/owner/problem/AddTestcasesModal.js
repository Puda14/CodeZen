"use client";

import { useState, useEffect } from "react";
import { FiPlus, FiTrash2, FiLoader } from "react-icons/fi";
import api from "@/utils/coreApi";
import { useToast } from "@/context/ToastProvider";
import Modal from "@/components/common/Modal";

const AddTestcaseRow = ({ testcase, index, onChange, onRemove, isSaving }) => {
  const handleFieldChange = (field, value) => {
    onChange(index, field, value);
  };
  return (
    <div className="p-3 border rounded bg-gray-100 dark:bg-gray-700 dark:border-gray-600 space-y-2 relative">
      {index > 0 && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="absolute top-1 right-1 text-red-500 hover:text-red-700 disabled:opacity-50"
          disabled={isSaving}
          title="Remove this testcase row"
        >
          <FiTrash2 size={16} />
        </button>
      )}
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
        New Testcase #{index + 1}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Input: <span className="text-red-500">*</span>
          </label>
          <textarea
            value={testcase.input}
            onChange={(e) => handleFieldChange("input", e.target.value)}
            required
            className="w-full p-1.5 border border-gray-300 dark:border-gray-500 rounded dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-xs h-32 resize-y focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-70"
            disabled={isSaving}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Output: <span className="text-red-500">*</span>
          </label>
          <textarea
            value={testcase.output}
            onChange={(e) => handleFieldChange("output", e.target.value)}
            required
            className="w-full p-1.5 border border-gray-300 dark:border-gray-500 rounded dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-xs h-32 resize-y focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-70"
            disabled={isSaving}
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Score:
          </label>
          <input
            type="number"
            value={testcase.score}
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
            value={String(testcase.isPublic)}
            onChange={(e) => handleFieldChange("isPublic", e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-500 rounded p-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-70"
            disabled={isSaving}
          >
            <option value="true">Public</option>{" "}
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
  const [newTestcases, setNewTestcases] = useState([
    { input: "", output: "", score: 10, isPublic: false },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addRow = () => {
    setNewTestcases([
      ...newTestcases,
      { input: "", output: "", score: 10, isPublic: false },
    ]);
  };

  const removeRow = (indexToRemove) => {
    if (newTestcases.length <= 1) return;
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

    setIsSubmitting(true);
    const payload = newTestcases.map((tc) => ({
      input: tc.input,
      output: tc.output,
      score: Number(tc.score) || 0,
      isPublic: tc.isPublic === "true" || tc.isPublic === true,
    }));

    try {
      const apiUrl = `/contest/${contestId}/problems/${problemId}/testcases`;
      const response = await api.post(apiUrl, payload);
      if (response.data) {
        toast?.("Testcases added successfully!", "success");
        setNewTestcases([
          { input: "", output: "", score: 10, isPublic: false },
        ]);
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      } else {
        throw new Error("Failed to add testcases.");
      }
    } catch (error) {
      console.error("Failed to add testcases:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "An unknown error occurred.";
      toast?.(`Failed to add testcases: ${errorMessage}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setNewTestcases([{ input: "", output: "", score: 10, isPublic: false }]);
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
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {" "}
        {newTestcases.map((tc, index) => (
          <AddTestcaseRow
            key={index}
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
          className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 mt-2"
          disabled={isSubmitting}
        >
          <FiPlus size={16} /> Add
        </button>
      </div>

      <div className="flex justify-end gap-3 pt-6 mt-4 border-t dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center gap-2"
          disabled={isSubmitting || newTestcases.length === 0}
        >
          {isSubmitting && <FiLoader className="animate-spin" />}
          {isSubmitting ? "Adding..." : "Add Testcases"}
        </button>
      </div>
    </Modal>
  );
};

export default AddTestcasesModal;
