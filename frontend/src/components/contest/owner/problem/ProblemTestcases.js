"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FiEdit3,
  FiSave,
  FiX,
  FiLoader,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import { useParams } from "next/navigation";
import api from "@/utils/coreApi";
import { useToast } from "@/context/ToastProvider";
import SingleTestcase from "./SingleTestcase";
import AddTestcasesModal from "./AddTestcasesModal";
import ConfirmModal from "@/components/common/ConfirmModal"; // Use your confirmation modal

/**
 * Manages a list of testcases: viewing, editing, adding, and deleting.
 * @param {Object[]} initialTestcases - The initial array of testcases.
 * @param {string} problemId - The ID of the parent problem.
 * @param {function} [onUpdateSuccess] - Callback triggered after any successful update (add, edit, delete) to signal data refresh.
 */
const ProblemTestcases = ({
  testcases: initialTestcases = [],
  problemId,
  onUpdateSuccess,
}) => {
  const { id: contestId } = useParams();
  const toastContextValue = useToast();
  const toast = toastContextValue?.showToast;
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testcases, setTestcases] = useState(initialTestcases);
  const [lastSavedTestcases, setLastSavedTestcases] =
    useState(initialTestcases);
  const justSaved = useRef(false);

  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!isEditing && !justSaved.current) {
      setTestcases(initialTestcases);
      setLastSavedTestcases(initialTestcases);
      if (isDeleteMode) {
        setIsDeleteMode(false);
        setSelectedIds(new Set());
      }
    }
    if (!isEditing) {
      justSaved.current = false;
    }
  }, [initialTestcases, isEditing]);

  const handleTestcaseChange = useCallback((index, field, value) => {
    setTestcases((current) =>
      current.map((tc, idx) => (idx === index ? { ...tc, [field]: value } : tc))
    );
  }, []);

  const hasChanges = useCallback(
    (currentTc, index) => {
      const originalTc = lastSavedTestcases[index];
      if (!originalTc) return false;
      return (
        Number(currentTc.score) !== Number(originalTc.score) ||
        (currentTc.isPublic === "true" || currentTc.isPublic === true) !==
          originalTc.isPublic ||
        currentTc.input !== originalTc.input ||
        currentTc.output !== originalTc.output
      );
    },
    [lastSavedTestcases]
  );

  const cancelEditing = () => {
    setTestcases(initialTestcases);
    setLastSavedTestcases(initialTestcases);
    justSaved.current = false;
    setIsEditing(false);
  };

  const handleUpdateTestcase = async () => {
    if (typeof toast !== "function") console.error("Toast unavailable");

    if (!contestId || !problemId) {
      toast?.("Cannot save: Invalid contest or problem reference.", "error");
      return;
    }

    const changedTestcasesPayload = testcases
      .map((tc, index) => ({ ...tc, originalIndex: index }))
      .filter((tc) => hasChanges(tc, tc.originalIndex))
      .map((tc) => ({
        id: tc._id || tc.id,
        score: Number(tc.score),
        input: tc.input ?? "",
        output: tc.output ?? "",
        isPublic: tc.isPublic === "true" || tc.isPublic === true,
      }))
      .filter((payload) => payload.id);

    if (changedTestcasesPayload.length === 0) {
      toast?.("No changes detected to save.", "info");
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    const apiUrl = `/contest/${contestId}/problems/${problemId}/testcases`;
    try {
      const response = await api.patch(apiUrl, changedTestcasesPayload);
      if (response.status === 200 || response.status === 204 || response.data) {
        toast?.("Testcases updated successfully!", "success");
        const savedState = [...testcases];
        setLastSavedTestcases(savedState);
        justSaved.current = true;
        setIsEditing(false);
        if (onUpdateSuccess) onUpdateSuccess();
      } else {
        throw new Error(response.data?.message || "Update failed");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";
      toast?.(`Failed to update testcases: ${errorMessage}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDeleteSelected = async () => {
    if (selectedIds.size === 0 || isDeleting) return;
    setIsDeleting(true);
    const idsToDelete = Array.from(selectedIds);
    const apiUrl = `/contest/${contestId}/problems/${problemId}/testcases`;

    try {
      const response = await api.delete(apiUrl, { data: idsToDelete });
      if (response.status === 200 || response.status === 204 || response.data) {
        toast?.(
          `${idsToDelete.length} testcase(s) deleted successfully!`,
          "success"
        );
        setSelectedIds(new Set());
        setIsDeleteMode(false);
        setShowDeleteConfirmModal(false);
        if (onUpdateSuccess) onUpdateSuccess();
      } else {
        throw new Error(response.data?.message || "Delete failed");
      }
    } catch (error) {
      console.error("Failed to delete testcases:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";
      toast?.(`Failed to delete testcases: ${errorMessage}`, "error");
      setShowDeleteConfirmModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddTestcasesSuccess = () => {
    setShowAddModal(false);
    if (onUpdateSuccess) {
      onUpdateSuccess();
    }
  };

  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setSelectedIds(new Set());
    setIsEditing(false);
  };

  const handleTestcaseSelect = (testcaseId) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(testcaseId)) newSet.delete(testcaseId);
      else newSet.add(testcaseId);
      return newSet;
    });
  };

  const handleDeleteSelectedClick = () => {
    if (selectedIds.size === 0) {
      toast?.("Please select at least one testcase.", "warning");
      return;
    }
    setShowDeleteConfirmModal(true);
  };

  if (!initialTestcases) return <p>Loading testcases...</p>;

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex justify-between items-center border-b pb-2 mb-4 dark:border-gray-700">
        <h4 className="font-semibold text-gray-700 dark:text-gray-200">
          Testcases ({testcases.length})
        </h4>
        <div className="flex gap-2 items-center">
          {isEditing ? (
            <>
              {isSaving && <FiLoader className="animate-spin text-blue-500" />}
              <button
                onClick={handleUpdateTestcase}
                className="text-sm text-blue-600 hover:underline disabled:opacity-50 flex items-center gap-1"
                disabled={isSaving}
              >
                <FiSave /> Save
              </button>
              <button
                onClick={cancelEditing}
                className="text-sm text-gray-600 hover:underline disabled:opacity-50 flex items-center gap-1"
                disabled={isSaving}
              >
                <FiX /> Cancel
              </button>
            </>
          ) : isDeleteMode ? (
            <>
              {isDeleting && <FiLoader className="animate-spin text-red-500" />}
              <button
                onClick={handleDeleteSelectedClick}
                className="text-sm text-red-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                disabled={isDeleting || selectedIds.size === 0}
              >
                <FiTrash2 /> Delete ({selectedIds.size})
              </button>
              <button
                onClick={toggleDeleteMode}
                className="text-sm text-gray-600 hover:underline disabled:opacity-50 flex items-center gap-1"
                disabled={isDeleting}
              >
                <FiX /> Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-sm text-green-600 hover:underline flex items-center gap-1"
              >
                <FiPlus /> Add
              </button>
              <button
                onClick={toggleDeleteMode}
                className="text-sm text-red-600 hover:underline flex items-center gap-1"
              >
                <FiTrash2 /> Delete
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <FiEdit3 /> Edit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Testcase List */}
      <div className="space-y-4">
        {testcases.map((tc, index) => {
          const testcaseId = tc._id || tc.id;
          if (!testcaseId) {
            console.warn("Testcase missing ID, cannot select/delete:", tc);
          }
          const isSelected = testcaseId ? selectedIds.has(testcaseId) : false;
          return (
            <SingleTestcase
              key={testcaseId || `testcase-${index}`}
              testcase={tc}
              index={index}
              isEditing={isEditing}
              isSaving={isSaving}
              onChange={handleTestcaseChange}
              isDeleteMode={isDeleteMode}
              isSelected={isSelected}
              onSelect={testcaseId ? handleTestcaseSelect : () => {}}
            />
          );
        })}
        {testcases.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 italic text-sm">
            No testcases available for this problem.
          </p>
        )}
      </div>

      {/* Modals */}
      <AddTestcasesModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmitSuccess={handleAddTestcasesSuccess}
        contestId={contestId}
        problemId={problemId}
      />

      {/* Use your existing ConfirmModal */}
      {showDeleteConfirmModal && (
        <ConfirmModal
          message={`Are you sure you want to delete ${selectedIds.size} selected testcase(s)? This action cannot be undone.`}
          onConfirm={handleConfirmDeleteSelected}
          onCancel={() => setShowDeleteConfirmModal(false)}
        />
      )}
    </div>
  );
};

export default ProblemTestcases;
