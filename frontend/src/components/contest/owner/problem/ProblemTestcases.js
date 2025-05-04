"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FiEdit3,
  FiSave,
  FiX,
  FiLoader,
  FiPlus,
  FiTrash2,
  FiAlertCircle,
} from "react-icons/fi";
import { useParams } from "next/navigation";
import api from "@/utils/coreApi";
import { useToast } from "@/context/ToastProvider";
import SingleTestcase from "./SingleTestcase";
import AddTestcasesModal from "./AddTestcasesModal";
import ConfirmModal from "@/components/common/ConfirmModal";

const ProblemTestcases = ({ problemId }) => {
  const { id: contestId } = useParams();
  const toastContextValue = useToast();
  const toast = toastContextValue?.showToast;
  const [testcases, setTestcases] = useState([]);
  const [lastSavedTestcases, setLastSavedTestcases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchTestcases = useCallback(async () => {
    if (!contestId || !problemId) {
      setError("Missing contest or problem ID.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const apiUrl = `/contest/${contestId}/problems/${problemId}/owner`;
      const response = await api.get(apiUrl);
      const fetchedTestcases = response.data?.testcases || [];
      setTestcases(fetchedTestcases);
      setLastSavedTestcases(fetchedTestcases);
    } catch (err) {
      console.error("Failed to fetch testcases:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to load testcases.";
      setError(errorMsg);
      toast?.(errorMsg, "error");
      setTestcases([]);
      setLastSavedTestcases([]);
    } finally {
      setIsLoading(false);
    }
  }, [contestId, problemId, toast]);

  useEffect(() => {
    fetchTestcases();
  }, [fetchTestcases]);

  const handleTestcaseChange = useCallback((index, field, value) => {
    setTestcases((current) =>
      current.map((tc, idx) => (idx === index ? { ...tc, [field]: value } : tc))
    );
  }, []);

  const hasChanges = useCallback(
    (currentTc, index) => {
      const originalTc = lastSavedTestcases[index];
      if (!originalTc) return true;
      const currentIsPublic =
        currentTc.isPublic === "true" || currentTc.isPublic === true;
      const originalIsPublic =
        originalTc.isPublic === "true" || originalTc.isPublic === true;
      return (
        Number(currentTc.score) !== Number(originalTc.score) ||
        currentIsPublic !== originalIsPublic ||
        (currentTc.input ?? "") !== (originalTc.input ?? "") ||
        (currentTc.output ?? "") !== (originalTc.output ?? "")
      );
    },
    [lastSavedTestcases]
  );

  const cancelEditing = () => {
    setTestcases([...lastSavedTestcases]);
    setIsEditing(false);
  };

  const handleUpdateTestcase = async () => {
    if (!contestId || !problemId) {
      toast?.("Cannot save: Invalid context.", "error");
      return;
    }

    const changedTestcasesPayload = testcases
      .map((tc, index) => ({ ...tc, originalIndex: index }))
      .filter((tc) => hasChanges(tc, tc.originalIndex))
      .map((tc) => ({
        id: tc._id || tc.id,
        score: Number(tc.score) || 0,
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
      await api.patch(apiUrl, changedTestcasesPayload);
      toast?.("Testcases updated successfully!", "success");
      setIsEditing(false);
      fetchTestcases();
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
      await api.delete(apiUrl, { data: { ids: idsToDelete } });
      toast?.(
        `${idsToDelete.length} testcase(s) deleted successfully!`,
        "success"
      );
      setSelectedIds(new Set());
      setIsDeleteMode(false);
      setShowDeleteConfirmModal(false);
      fetchTestcases();
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
    fetchTestcases();
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

  // --- Render Logic ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <FiLoader className="animate-spin text-blue-500" />
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          Loading testcases...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm p-4 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-700">
        <FiAlertCircle />
        <span>{error}</span>
        <button
          onClick={fetchTestcases}
          className="ml-auto text-xs underline hover:text-red-800 dark:hover:text-red-300"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
                {" "}
                <FiSave /> Save{" "}
              </button>
              <button
                onClick={cancelEditing}
                className="text-sm text-gray-600 hover:underline disabled:opacity-50 flex items-center gap-1"
                disabled={isSaving}
              >
                {" "}
                <FiX /> Cancel{" "}
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
                {" "}
                <FiTrash2 /> Delete ({selectedIds.size}){" "}
              </button>
              <button
                onClick={toggleDeleteMode}
                className="text-sm text-gray-600 hover:underline disabled:opacity-50 flex items-center gap-1"
                disabled={isDeleting}
              >
                {" "}
                <FiX /> Cancel{" "}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-sm text-green-600 hover:underline flex items-center gap-1"
              >
                {" "}
                <FiPlus /> Add{" "}
              </button>
              <button
                onClick={toggleDeleteMode}
                className="text-sm text-red-600 hover:underline flex items-center gap-1"
              >
                {" "}
                <FiTrash2 /> Delete{" "}
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                {" "}
                <FiEdit3 /> Edit{" "}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {testcases.map((tc, index) => {
          const testcaseId = tc._id || tc.id;
          const canSelect = !!testcaseId;
          const isSelected = canSelect ? selectedIds.has(testcaseId) : false;
          return (
            <SingleTestcase
              key={testcaseId || `new-testcase-${index}`}
              testcase={tc}
              index={index}
              isEditing={isEditing}
              isSaving={isSaving}
              onChange={handleTestcaseChange}
              isDeleteMode={isDeleteMode}
              isSelected={isSelected}
              onSelect={canSelect ? handleTestcaseSelect : undefined}
            />
          );
        })}
        {testcases.length === 0 && !isLoading && (
          <p className="text-gray-500 dark:text-gray-400 italic text-sm">
            No testcases available for this problem. Click 'Add' to create some.
          </p>
        )}
      </div>

      <AddTestcasesModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmitSuccess={handleAddTestcasesSuccess}
        contestId={contestId}
        problemId={problemId}
      />

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
