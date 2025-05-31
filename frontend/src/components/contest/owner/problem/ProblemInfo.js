"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FiTag, FiEdit3, FiTrash2, FiLoader, FiX } from "react-icons/fi";
import { format } from "date-fns";
import { submissionLimits } from "@/config/contestConfig";
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
  const toast = useToast()?.showToast;

  const [maxSubmissions, setMaxSubmissions] = useState(
    problem.maxSubmissions !== undefined && problem.maxSubmissions !== null
      ? problem.maxSubmissions
      : ""
  );
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
    maxSubmissions: problem.maxSubmissions,
  });

  useEffect(() => {
    setName(problem.name);
    setDifficulty(problem.difficulty);
    setTags(problem.tags || []);
    setContent(problem.content);
    setMaxSubmissions(
      problem.maxSubmissions !== undefined && problem.maxSubmissions !== null
        ? problem.maxSubmissions
        : ""
    );
    setInitialState({
      name: problem.name,
      difficulty: problem.difficulty,
      tags: problem.tags || [],
      content: problem.content,
      maxSubmissions: problem.maxSubmissions,
    });
  }, [problem]);

  useEffect(() => {
    if (!editing && !loading) {
      setName(initialState.name);
      setDifficulty(initialState.difficulty);
      setTags(initialState.tags);
      setContent(initialState.content);
      setMaxSubmissions(
        initialState.maxSubmissions !== undefined &&
          initialState.maxSubmissions !== null
          ? initialState.maxSubmissions
          : ""
      );
    }
  }, [editing, loading, initialState]);

  const handleUpdate = async () => {
    if (!name.trim()) {
      toast?.("Problem name cannot be empty.", "error");
      return;
    }
    if (!tags || tags.length === 0) {
      toast?.("At least one tag is required.", "error");
      return;
    }

    const numericMaxSubmissions =
      maxSubmissions === "" ? NaN : parseInt(maxSubmissions, 10);

    if (
      isNaN(numericMaxSubmissions) ||
      numericMaxSubmissions < submissionLimits.min ||
      numericMaxSubmissions > submissionLimits.max
    ) {
      toast?.(
        `Max submissions must be a number between ${submissionLimits.min} and ${submissionLimits.max}.`,
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      const payloadTags = tags.map(
        (tagKeyOrValue) => Tags[tagKeyOrValue] || tagKeyOrValue
      );

      const response = await api.patch(
        `/contest/${contestId}/problems/${problem._id}`,
        {
          name,
          difficulty,
          tags: payloadTags,
          content,
          maxSubmissions: numericMaxSubmissions,
        }
      );
      if (response.data) {
        toast?.("Problem updated successfully", "success");
        setInitialState({
          name,
          difficulty,
          tags,
          content,
          maxSubmissions: numericMaxSubmissions,
        });
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

  const handleDeleteClick = () => {
    if (isDeleting) return;
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setShowConfirmModal(false);
    try {
      await api.delete(`/contest/${contestId}/problems/${problem._id}`);
      toast?.(`Problem "${initialState.name}" deleted successfully`, "success");
      if (onProblemDeleted) onProblemDeleted(problem._id);
    } catch (err) {
      toast?.(
        err?.response?.data?.message || "Failed to delete problem",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    setTagInput(value);
    if (value.trim() && typeof Tags === "object") {
      const lower = value.toLowerCase();
      const currentTagKeys = tags;
      const suggestions = Object.keys(Tags).filter(
        (key) =>
          (key.toLowerCase().includes(lower) ||
            (Tags[key] && Tags[key].toLowerCase().includes(lower))) &&
          !currentTagKeys.includes(key)
      );
      setTagSuggestions(suggestions);
    } else {
      setTagSuggestions([]);
    }
  };

  const handleAddTag = (tagKey) => {
    const trimmedKey = tagKey?.trim();
    if (!trimmedKey || !Tags?.hasOwnProperty(trimmedKey)) {
      if (trimmedKey)
        toast?.(
          `Tag key "${trimmedKey}" is not a valid predefined tag.`,
          "warning"
        );
      setTagInput("");
      setTagSuggestions([]);
      return;
    }
    if (!tags.includes(trimmedKey)) setTags([...tags, trimmedKey]);
    setTagInput("");
    setTagSuggestions([]);
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const inputLower = tagInput.trim().toLowerCase();
      let exactMatchKey = Object.keys(Tags).find(
        (key) =>
          key.toLowerCase() === inputLower ||
          (Tags[key] && Tags[key].toLowerCase() === inputLower)
      );
      if (exactMatchKey) {
        if (
          Tags[exactMatchKey] &&
          Tags[exactMatchKey].toLowerCase() === inputLower &&
          exactMatchKey.toLowerCase() !== inputLower
        ) {
        } else {
          const foundKey = Object.keys(Tags).find(
            (k) => k.toLowerCase() === inputLower
          );
          if (foundKey) exactMatchKey = foundKey;
          else {
            for (const k in Tags) {
              if (Tags[k].toLowerCase() === inputLower) {
                exactMatchKey = k;
                break;
              }
            }
          }
        }
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

  const handleRemoveTag = (tagKeyToRemove) => {
    setTags(tags.filter((key) => key !== tagKeyToRemove));
  };

  const handleToggleEdit = () => {
    if (editing) {
      setName(initialState.name);
      setDifficulty(initialState.difficulty);
      setTags(initialState.tags);
      setContent(initialState.content);
      setMaxSubmissions(
        initialState.maxSubmissions !== undefined &&
          initialState.maxSubmissions !== null
          ? initialState.maxSubmissions
          : ""
      );
      setTagInput("");
      setTagSuggestions([]);
    } else {
      setInitialState({
        name: problem.name,
        difficulty: problem.difficulty,
        tags: problem.tags || [],
        content: problem.content,
        maxSubmissions: problem.maxSubmissions,
      });
      setName(problem.name);
      setDifficulty(problem.difficulty);
      setTags(problem.tags || []);
      setContent(problem.content);
      setMaxSubmissions(
        problem.maxSubmissions !== undefined && problem.maxSubmissions !== null
          ? problem.maxSubmissions
          : ""
      );
    }
    setEditing(!editing);
  };

  const handleMaxSubmissionsChange = (e) => {
    const rawValue = e.target.value;

    if (rawValue.trim() === "") {
      setMaxSubmissions("");
      return;
    }

    let numericValue = parseInt(rawValue, 10);

    if (isNaN(numericValue)) {
      return;
    }

    if (numericValue < submissionLimits.min) {
      numericValue = submissionLimits.min;
    } else if (numericValue > submissionLimits.max) {
      numericValue = submissionLimits.max;
    }

    setMaxSubmissions(numericValue);
  };

  return (
    <div className="space-y-6 pt-6 mt-6 border-t dark:border-gray-600 first:mt-0 first:pt-0 first:border-t-0">
      <div className="flex justify-between items-start gap-4">
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-grow text-xl md:text-2xl font-semibold text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 py-1"
            disabled={loading || isDeleting}
            placeholder="Problem Name"
          />
        ) : (
          <h3 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white break-words mr-2">
            {initialState.name}
          </h3>
        )}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 mt-1">
          {editing ? (
            <button
              onClick={handleToggleEdit}
              disabled={loading || isDeleting}
              className="text-sm text-gray-600 dark:text-gray-400 hover:underline disabled:opacity-50 px-3 py-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-1.5"
            >
              <FiX size={16} /> Cancel
            </button>
          ) : (
            <>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting || loading}
                className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1.5 disabled:opacity-50 px-3 py-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-700/30"
                title="Delete problem"
              >
                {isDeleting ? (
                  <FiLoader className="animate-spin" />
                ) : (
                  <FiTrash2 />
                )}
                <span className="hidden sm:inline">
                  {isDeleting ? "Deleting..." : "Delete"}
                </span>
              </button>
              <button
                onClick={handleToggleEdit}
                disabled={loading || isDeleting}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1.5 disabled:opacity-50 bg-blue-100 dark:bg-blue-700/30 hover:bg-blue-200 dark:hover:bg-blue-700/50 px-3 py-1.5 rounded-md"
              >
                <FiEdit3 /> Edit
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div className="p-3 bg-gray-100 dark:bg-gray-700/40 rounded-md">
          <span className="font-medium text-gray-500 dark:text-gray-400 block mb-0.5">
            ID:
          </span>
          <span className="text-gray-700 dark:text-gray-200 break-all">
            {problem._id}
          </span>
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-700/40 rounded-md">
          <label
            htmlFor={`difficulty-${problem._id}`}
            className="font-medium text-gray-500 dark:text-gray-400 block mb-0.5"
          >
            Difficulty:
          </label>
          {editing ? (
            <select
              id={`difficulty-${problem._id}`}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full p-1.5 rounded border dark:bg-gray-800 dark:border-gray-600 text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={loading || isDeleting}
            >
              {Object.values(Difficulty).map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          ) : (
            <span
              className={`${
                difficultyColor[initialState.difficulty] || "text-gray-500"
              } font-semibold`}
            >
              {initialState.difficulty.charAt(0).toUpperCase() +
                initialState.difficulty.slice(1)}
            </span>
          )}
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-700/40 rounded-md">
          <label
            htmlFor={`maxSubmissions-${problem._id}`}
            className="font-medium text-gray-500 dark:text-gray-400 block mb-0.5"
          >
            Max Submissions:
          </label>
          {editing ? (
            <input
              type="number"
              id={`maxSubmissions-${problem._id}`}
              value={maxSubmissions}
              onChange={handleMaxSubmissionsChange}
              className="w-full p-1.5 rounded border dark:bg-gray-800 dark:border-gray-600 text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-sm"
              disabled={loading || isDeleting}
            />
          ) : (
            <span className="text-gray-700 dark:text-gray-200 font-semibold">
              {initialState.maxSubmissions !== undefined &&
              initialState.maxSubmissions !== null
                ? initialState.maxSubmissions
                : "N/A"}
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-gray-100 dark:bg-gray-700/40 rounded-md">
          <p className="font-medium text-gray-500 dark:text-gray-400 mb-0.5">
            Created:
          </p>
          <p className="text-gray-700 dark:text-gray-200">
            {format(new Date(problem.createdAt), "dd/MM/yyyy HH:mm")}
          </p>
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-700/40 rounded-md">
          <p className="font-medium text-gray-500 dark:text-gray-400 mb-0.5">
            Updated:
          </p>
          <p className="text-gray-700 dark:text-gray-200">
            {format(new Date(problem.updatedAt), "dd/MM/yyyy HH:mm")}
          </p>
        </div>
      </div>

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
              placeholder="Type tag (e.g., DP) and press Enter"
              className="flex-grow border dark:bg-gray-800 p-2 rounded disabled:opacity-50 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={loading || isDeleting}
              autoComplete="off"
            />
          </div>
        )}
        {editing && tagInput && tagSuggestions.length > 0 && (
          <ul className="absolute left-0 w-full md:w-1/2 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded shadow-lg z-20">
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
        <div className="flex flex-wrap gap-2 min-h-[24px] mt-2">
          {(editing ? tags : initialState.tags).map((tagKey, idx) => (
            <span
              key={`${tagKey}-${idx}`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                tagColors[idx % tagColors.length]
              }`}
            >
              <FiTag size={12} /> {Tags[tagKey] || tagKey}
              {editing && (
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tagKey)}
                  className="ml-1 opacity-70 hover:opacity-100 focus:outline-none"
                  disabled={loading || isDeleting}
                  aria-label={`Remove tag ${Tags[tagKey] || tagKey}`}
                >
                  &times;
                </button>
              )}
            </span>
          ))}
          {!editing && initialState.tags.length === 0 && (
            <span className="text-xs italic text-gray-500 dark:text-gray-400">
              No tags assigned.
            </span>
          )}
        </div>
      </div>

      <div>
        <label className="font-semibold mb-1 block text-sm text-gray-700 dark:text-gray-300">
          Description:
        </label>
        {editing ? (
          <>
            <MarkdownEditorWithPreview
              value={content}
              onChange={setContent}
              isDisabled={loading || isDeleting}
              minHeight="400px"
            />
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleUpdate}
                disabled={loading || isDeleting}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <FiLoader className="animate-spin h-4 w-4" /> : null}
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        ) : content ? (
          <div className="prose dark:prose-invert max-w-none p-4 border dark:border-gray-700 rounded-md bg-white dark:bg-gray-800/30">
            <MarkdownViewer value={initialState.content} />
          </div>
        ) : (
          <p className="italic text-gray-500 dark:text-gray-400 text-sm">
            No description provided.
          </p>
        )}
      </div>

      {showConfirmModal && (
        <ConfirmModal
          message={`Are you sure you want to delete problem "${
            initialState.name || "this problem"
          }"? This action cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowConfirmModal(false)}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default ProblemInfo;
