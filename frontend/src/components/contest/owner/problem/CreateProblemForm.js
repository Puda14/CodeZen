"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { FiPlus, FiTrash2, FiLoader, FiTag } from "react-icons/fi";
import api from "@/utils/coreApi";
import { useToast } from "@/context/ToastProvider";
import { Difficulty } from "@/enums/difficulty.enum";
import { Tags } from "@/enums/tags.enum";
import MarkdownEditorWithPreview from "@/components/common/MarkdownEditorWithPreview";

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
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-1 right-1 text-red-500 hover:text-red-700 disabled:opacity-50"
        disabled={isSaving}
        title="Remove testcase"
      >
        {" "}
        <FiTrash2 size={16} />{" "}
      </button>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
        {" "}
        Testcase #{index + 1}{" "}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {" "}
            Input:{" "}
          </label>
          <textarea
            value={testcase.input}
            onChange={(e) => handleFieldChange("input", e.target.value)}
            required
            className="w-full p-1.5 border border-gray-300 dark:border-gray-500 rounded dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-xs h-40 resize-y focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-70"
            disabled={isSaving}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {" "}
            Output:{" "}
          </label>
          <textarea
            value={testcase.output}
            onChange={(e) => handleFieldChange("output", e.target.value)}
            required
            className="w-full p-1.5 border border-gray-300 dark:border-gray-500 rounded dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-xs h-40 resize-y focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-70"
            disabled={isSaving}
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {" "}
            Score:{" "}
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
            {" "}
            Visibility:{" "}
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

const tagColors = [
  "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100",
  "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100",
  "bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-100",
  "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-100",
  "bg-pink-100 text-pink-700 dark:bg-pink-800 dark:text-pink-100",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-100",
];

const CreateProblemForm = ({ onProblemCreated, onCancel }) => {
  const { id: contestId } = useParams();
  const toastContextValue = useToast();
  const toast = toastContextValue?.showToast;

  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [difficulty, setDifficulty] = useState(Difficulty.NORMAL);
  const [tags, setTags] = useState([]);
  const [testcases, setTestcases] = useState([
    { input: "", output: "", score: 10, isPublic: true },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState([]);

  const addTestcase = () => {
    setTestcases([
      ...testcases,
      { input: "", output: "", score: 10, isPublic: false },
    ]);
  };
  const removeTestcase = (indexToRemove) => {
    if (testcases.length <= 1) {
      toast?.("At least one testcase is required.", "warning");
      return;
    }
    setTestcases(testcases.filter((_, index) => index !== indexToRemove));
  };
  const updateTestcase = (index, field, value) => {
    setTestcases((currentTestcases) =>
      currentTestcases.map((tc, idx) =>
        idx === index ? { ...tc, [field]: value } : tc
      )
    );
  };

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
    } else if (tags.includes(tagValueToAdd)) {
      toast?.(`Tag "${tagValueToAdd}" is already added.`, "info");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!name.trim()) {
      toast?.("Problem name is required.", "error");
      setIsLoading(false);
      return;
    }
    if (!content.trim()) {
      toast?.("Problem description is required.", "error");
      setIsLoading(false);
      return;
    }
    if (tags.length === 0) {
      toast?.("At least one tag is required.", "error");
      setIsLoading(false);
      return;
    }
    if (testcases.some((tc) => !tc.input?.trim() || !tc.output?.trim())) {
      toast?.("All testcases must have non-empty input and output.", "error");
      setIsLoading(false);
      return;
    }

    const payload = {
      name,
      content,
      difficulty,
      tags: tags,
      testcases: testcases.map((tc) => ({
        ...tc,
        score: Number(tc.score) || 0,
        isPublic: tc.isPublic === "true" || tc.isPublic === true,
      })),
    };

    try {
      const response = await api.post(
        `/contest/${contestId}/problems`,
        payload
      );
      if (response.data) {
        toast?.("Problem created successfully!", "success");
        if (onProblemCreated) onProblemCreated();
      } else {
        throw new Error("Problem creation failed.");
      }
    } catch (error) {
      console.error("Failed to create problem:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "An unknown error.";
      toast?.(`Failed to create problem: ${errorMessage}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 border-b pb-2">
        {" "}
        Create New Problem{" "}
      </h3>

      {/* Problem Name */}
      <div>
        <label
          htmlFor="problemName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {" "}
          Problem Name <span className="text-red-500">*</span>{" "}
        </label>
        <input
          type="text"
          id="problemName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        />
      </div>

      {/* Difficulty */}
      <div>
        <label
          htmlFor="difficulty"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {" "}
          Difficulty <span className="text-red-500">*</span>{" "}
        </label>
        <select
          id="difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        >
          {Object.values(Difficulty).map((level) => (
            <option key={level} value={level}>
              {" "}
              {level.charAt(0).toUpperCase() + level.slice(1)}{" "}
            </option>
          ))}
        </select>
      </div>

      {/* --- Tags --- */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {" "}
          Tags <span className="text-red-500">*</span>{" "}
        </label>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={handleTagInputChange}
            onKeyDown={handleTagKeyDown}
            placeholder="Type to search and press Enter to add"
            className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
            autoComplete="off"
          />
        </div>

        {/* Suggestions Dropdown */}
        {tagInput && tagSuggestions.length > 0 && (
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

        <div className="flex flex-wrap gap-2 min-h-[24px] mt-2">
          {tags.map((tagValue, index) => (
            <span
              key={`${tagValue}-${index}`}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                tagColors[index % tagColors.length]
              }`}
            >
              <FiTag size={12} />
              {tagValue}
              <button
                type="button"
                onClick={() => handleRemoveTag(tagValue)}
                className="ml-1 opacity-70 hover:opacity-100"
                disabled={isLoading}
                aria-label={`Remove tag ${tagValue}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Content/Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {" "}
          Description (Markdown) <span className="text-red-500">*</span>{" "}
        </label>
        <MarkdownEditorWithPreview
          value={content}
          onChange={setContent}
          isDisabled={isLoading}
          minHeight="300px"
        />
      </div>

      {/* Testcases */}
      <div className="space-y-3 pt-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {" "}
          Testcases <span className="text-red-500">*</span>{" "}
        </label>
        {testcases.map((tc, index) => (
          <NewTestcaseInput
            key={`new-tc-${index}`}
            testcase={tc}
            index={index}
            onChange={updateTestcase}
            onRemove={removeTestcase}
            isSaving={isLoading}
          />
        ))}
        <button
          type="button"
          onClick={addTestcase}
          className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
          disabled={isLoading}
        >
          {" "}
          <FiPlus size={16} /> Add Testcase{" "}
        </button>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          disabled={isLoading}
        >
          {" "}
          Cancel{" "}
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading && <FiLoader className="animate-spin" />}{" "}
          {isLoading ? "Creating..." : "Create Problem"}
        </button>
      </div>
    </form>
  );
};

export default CreateProblemForm;
