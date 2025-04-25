"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FiTag, FiEdit3, FiTrash2, FiLoader } from "react-icons/fi";
import { format } from "date-fns";
import { Difficulty } from "@/enums/difficulty.enum";
import { Tags } from "@/enums/tags.enum";
import MarkdownEditorWithPreview from "@/components/common/MarkdownEditorWithPreview";
import MarkdownViewer from "@/components/common/MarkdownViewer";
import api from "@/utils/coreApi";
import { useToast } from "@/context/ToastProvider";
import ConfirmModal from "@/components/common/ConfirmModal";

const difficultyColor = {
  [Difficulty.EASY]: "text-green-500 dark:text-green-400",
  [Difficulty.NORMAL]: "text-yellow-500 dark:text-yellow-400",
  [Difficulty.HARD]: "text-red-500 dark:text-red-400",
  [Difficulty.VERY_HARD]: "text-pink-600 dark:text-pink-500",
};

const tagColors = [
  "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100",
  "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100",
  "bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-100",
  "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-100",
  "bg-pink-100 text-pink-700 dark:bg-pink-800 dark:text-pink-100",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-100",
];

const ProblemInfo = ({ problem, onProblemDeleted }) => {
  const { id: contestId } = useParams();
  const toastContextValue = useToast();
  const toast = toastContextValue?.showToast;
  const [name, setName] = useState(problem.name);
  const [difficulty, setDifficulty] = useState(problem.difficulty);
  const [tags, setTags] = useState(problem.tags || []);
  const [content, setContent] = useState(problem.content);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState([]);

  const [initialState, setInitialState] = useState({
    name: problem.name,
    difficulty: problem.difficulty,
    tags: problem.tags || [],
    content: problem.content,
  });

  // Reset form to initial state on cancel or successful save
  useEffect(() => {
    if (!editing && !loading) {
      setName(initialState.name);
      setDifficulty(initialState.difficulty);
      setTags(initialState.tags);
      setContent(initialState.content);
    }
  }, [editing, loading, initialState]);

  // Update problem handler
  const handleUpdate = async () => {
    setLoading(true);
    try {
      const response = await api.patch(
        `/contest/${contestId}/problems/${problem._id}`,
        { name, difficulty, tags, content }
      );
      if (response.data) {
        toast?.("Problem updated successfully", "success");
        setInitialState({ name, difficulty, tags, content });
        setEditing(false);
      } else {
        throw new Error("Update failed: No data received");
      }
    } catch (err) {
      toast?.(
        err?.response?.data?.message || "Failed to update problem",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Delete problem handlers
  const handleDeleteClick = () => {
    if (isDeleting) return;
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await api.delete(`/contest/${contestId}/problems/${problem._id}`);
      toast?.(`Problem "${problem.name}" deleted successfully`, "success");
      setShowConfirmModal(false);
      if (onProblemDeleted) {
        onProblemDeleted();
      }
    } catch (err) {
      console.error("Failed to delete problem:", err);
      toast?.(
        err?.response?.data?.message || "Failed to delete problem",
        "error"
      );
      setShowConfirmModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Tag input handlers
  const handleTagInputChange = (e) => {
    const value = e.target.value;
    setTagInput(value);
    if (value.trim() && typeof Tags === "object") {
      const lowerCaseValue = value.toLowerCase();
      const suggestions = Object.keys(Tags).filter(
        (tagKey) =>
          tagKey.toLowerCase().includes(lowerCaseValue) ||
          (Tags[tagKey] && Tags[tagKey].toLowerCase().includes(lowerCaseValue))
      );
      setTagSuggestions(suggestions);
    } else {
      setTagSuggestions([]);
    }
  };

  const handleAddTag = (tagKeyToAdd) => {
    const trimmedTagKey = tagKeyToAdd?.trim();
    if (!trimmedTagKey || !Tags || !Tags.hasOwnProperty(trimmedTagKey)) {
      if (trimmedTagKey)
        toast?.(
          `Tag "${trimmedTagKey}" is not a valid predefined tag.`,
          "warning"
        );
      setTagInput("");
      setTagSuggestions([]);
      return;
    }
    const tagValueToAdd = Tags[trimmedTagKey];
    if (tagValueToAdd && !tags.includes(tagValueToAdd)) {
      setTags([...tags, tagValueToAdd]);
    }
    setTagInput("");
    setTagSuggestions([]);
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const valueToMatch = tagInput.trim().toLowerCase();
      const exactMatchKey = Object.keys(Tags || {}).find(
        (key) =>
          key.toLowerCase() === valueToMatch ||
          (Tags[key] && Tags[key].toLowerCase() === valueToMatch)
      );
      if (exactMatchKey) {
        handleAddTag(exactMatchKey);
      } else if (tagSuggestions.length > 0) {
        handleAddTag(tagSuggestions[0]);
      } else {
        toast?.(
          `Tag "${tagInput.trim()}" is not valid. Please choose from suggestions.`,
          "warning"
        );
        setTagInput("");
        setTagSuggestions([]);
      }
    }
  };

  const handleRemoveTag = (tagValueToRemove) => {
    setTags(tags.filter((tagValue) => tagValue !== tagValueToRemove));
  };

  // Toggle Edit/Cancel handler
  const handleToggleEdit = () => {
    if (editing) {
      setName(initialState.name);
      setDifficulty(initialState.difficulty);
      setTags(initialState.tags);
      setContent(initialState.content);
      setTagInput("");
      setTagSuggestions([]);
    } else {
      setInitialState({ name, difficulty, tags, content });
    }
    setEditing(!editing);
  };

  return (
    <div className="space-y-6 pt-6 mt-6">
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-grow text-lg font-semibold text-gray-900 dark:text-white bg-transparent border-b focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
        ) : (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white break-words">
            {name}
          </h3>
        )}
        <div className="flex gap-2 flex-shrink-0">
          {!editing && (
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="text-sm text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete problem"
            >
              {isDeleting ? (
                <FiLoader className="animate-spin" />
              ) : (
                <FiTrash2 />
              )}
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}
          <button
            onClick={handleToggleEdit}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
            disabled={loading || isDeleting}
          >
            <FiEdit3 /> {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-200">
        <p>
          <strong>ID:</strong> {problem._id}
        </p>
        <p>
          <strong>Difficulty:</strong>{" "}
          {editing ? (
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="ml-1 p-1 rounded border dark:bg-gray-800 dark:border-gray-600"
              disabled={loading}
            >
              {" "}
              {Object.values(Difficulty).map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}{" "}
            </select>
          ) : (
            <span className={difficultyColor[difficulty] || "text-gray-500"}>
              {difficulty}
            </span>
          )}
        </p>
        <p>
          <strong>Created:</strong>{" "}
          {format(new Date(problem.createdAt), "dd/MM/yyyy HH:mm")}
        </p>
        <p>
          <strong>Updated:</strong>{" "}
          {format(new Date(problem.updatedAt), "dd/MM/yyyy HH:mm")}
        </p>
      </div>

      {/* Tags Section */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tags:
        </label>
        {editing && (
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyDown={handleTagKeyDown}
              placeholder="Type to add tags"
              className="flex-grow border dark:bg-gray-800 p-1 rounded disabled:opacity-50 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
              autoComplete="off"
            />
          </div>
        )}
        {editing && tagInput && tagSuggestions.length > 0 && (
          <ul className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg z-10">
            {tagSuggestions.map((tagKey) => (
              <li
                key={tagKey}
                className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-700 text-sm"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleAddTag(tagKey);
                }}
              >
                {Tags[tagKey] || tagKey}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2 min-h-[24px]">
          {tags.map((tagValue, idx) => (
            <span
              key={`${tagValue}-${idx}`}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                tagColors[idx % tagColors.length]
              }`}
            >
              <FiTag size={12} /> {tagValue}
              {editing && (
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tagValue)}
                  className="ml-1 opacity-70 hover:opacity-100"
                  disabled={loading}
                >
                  &times;
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Description Section */}
      <div className="text-sm text-gray-700 dark:text-gray-300">
        <label className="font-semibold mb-1 block">Description:</label>
        {editing ? (
          <>
            <MarkdownEditorWithPreview
              value={content}
              onChange={setContent}
              isDisabled={loading}
              minHeight="500px"
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <FiLoader className="animate-spin" />}
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        ) : content ? (
          <MarkdownViewer value={content} />
        ) : (
          <p className="italic text-gray-500 dark:text-gray-400">
            No description provided.
          </p>
        )}
      </div>

      {showConfirmModal && (
        <ConfirmModal
          message={`Are you sure you want to delete problem "${
            problem.name || "this problem"
          }"? This action cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
};

export default ProblemInfo;
