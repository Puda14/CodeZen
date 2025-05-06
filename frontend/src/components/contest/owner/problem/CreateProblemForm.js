"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { FiPlus, FiTrash2, FiLoader, FiTag } from "react-icons/fi";
import api from "@/utils/coreApi";
import { useToast } from "@/context/ToastProvider";
import { Difficulty } from "@/enums/difficulty.enum";
import { Tags } from "@/enums/tags.enum";
import MarkdownEditorWithPreview from "@/components/common/MarkdownEditorWithPreview";
import NewTestcaseInput from "./NewTestcaseInput";
import { submissionLimits } from "@/config/contestConfig";

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
  const [maxSubmissions, setMaxSubmissions] = useState(
    submissionLimits.default
  );
  const [testcases, setTestcases] = useState([
    { input: "", output: "", score: 10, isPublic: true },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState([]);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch("/tmp_problem_des.md");
        if (response.ok) {
          const text = await response.text();
          setContent(text);
        }
      } catch (error) {
        console.error(
          "Could not fetch problem template for default content:",
          error
        );
      }
    };
    fetchTemplate();
  }, []);

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

  const updateTestcase = useCallback((index, field, value) => {
    setTestcases((currentTestcases) =>
      currentTestcases.map((tc, idx) =>
        idx === index ? { ...tc, [field]: value } : tc
      )
    );
  }, []);

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    setTagInput(value);
    if (value.trim() && typeof Tags === "object") {
      const lowerCaseValue = value.toLowerCase();
      const suggestions = Object.keys(Tags).filter(
        (tagKey) =>
          !tags.includes(Tags[tagKey]) &&
          (tagKey.toLowerCase().includes(lowerCaseValue) ||
            (Tags[tagKey] &&
              Tags[tagKey].toLowerCase().includes(lowerCaseValue)))
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
        toast?.(`Tag "${trimmedTagKey}" is not valid.`, "warning");
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
      if (exactMatchKey) handleAddTag(exactMatchKey);
      else if (tagSuggestions.length > 0) handleAddTag(tagSuggestions[0]);
      else {
        toast?.(`Tag "${tagInput.trim()}" is not valid.`, "warning");
        setTagInput("");
        setTagSuggestions([]);
      }
    }
  };

  const handleRemoveTag = (tagValueToRemove) => {
    setTags(tags.filter((tagValue) => tagValue !== tagValueToRemove));
  };

  const handleMaxSubmissionsChange = (e) => {
    let value = e.target.value;
    let processedValue = value;

    if (value !== "") {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue)) {
        return;
      }
      if (numValue < submissionLimits.min)
        processedValue = submissionLimits.min;
      else if (numValue > submissionLimits.max)
        processedValue = submissionLimits.max;
      else processedValue = numValue;
    }
    setMaxSubmissions(processedValue);
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
    const maxSubsNumber = parseInt(maxSubmissions, 10);
    if (
      isNaN(maxSubsNumber) ||
      maxSubsNumber < submissionLimits.min ||
      maxSubsNumber > submissionLimits.max
    ) {
      toast?.(
        `Max submissions must be a number between ${submissionLimits.min} and ${submissionLimits.max}.`,
        "error"
      );
      setIsLoading(false);
      return;
    }
    if (!testcases || testcases.length === 0) {
      toast?.("At least one testcase is required.", "error");
      setIsLoading(false);
      return;
    }
    if (testcases.some((tc) => !tc.input?.trim() || !tc.output?.trim())) {
      toast?.("All testcases require non-empty input and output.", "error");
      setIsLoading(false);
      return;
    }

    const payload = {
      name: name.trim(),
      content: content.trim(),
      difficulty,
      tags: tags,
      maxSubmissions: maxSubsNumber,
      testcases: testcases.map((tc) => ({
        input: tc.input?.trim() ?? "",
        output: tc.output?.trim() ?? "",
        score: Number(tc.score) || 0,
        isPublic: tc.isPublic === "true" || tc.isPublic === true,
      })),
    };

    try {
      console.log("Creating problem with payload:", payload);
      const response = await api.post(
        `/contest/${contestId}/problems`,
        payload
      );
      if (response.data) {
        toast?.("Problem created successfully!", "success");
        if (onProblemCreated) onProblemCreated();
      } else {
        throw new Error(response.data?.message || "Problem creation failed.");
      }
    } catch (error) {
      console.error("Failed to create problem:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "An unknown error occurred.";
      toast?.(`Failed to create problem: ${errorMessage}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 md:p-6">
      <div>
        <label
          htmlFor="problemName-create"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {" "}
          Problem Name <span className="text-red-500">*</span>{" "}
        </label>
        <input
          type="text"
          id="problemName-create"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="difficulty-create"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {" "}
            Difficulty <span className="text-red-500">*</span>{" "}
          </label>
          <select
            id="difficulty-create"
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
        <div>
          <label
            htmlFor="maxSubmissions-create"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {" "}
            Max Submissions <span className="text-red-500">*</span>{" "}
          </label>
          <input
            type="number"
            id="maxSubmissions-create"
            name="maxSubmissions"
            value={maxSubmissions}
            onChange={handleMaxSubmissionsChange}
            required
            min={submissionLimits.min}
            max={submissionLimits.max}
            step="1"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Must be between {submissionLimits.min} and {submissionLimits.max}.
          </p>
        </div>
      </div>
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
        {tagInput && tagSuggestions.length > 0 && (
          <ul className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg z-50">
            {" "}
            {tagSuggestions.map((tagKey) => (
              <li
                key={tagKey}
                className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-700 text-sm"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleAddTag(tagKey);
                }}
              >
                {" "}
                {Tags[tagKey] || tagKey}{" "}
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
              {" "}
              <FiTag size={12} /> {tagValue}{" "}
              <button
                type="button"
                onClick={() => handleRemoveTag(tagValue)}
                className="ml-1 opacity-70 hover:opacity-100"
                disabled={isLoading}
                aria-label={`Remove tag ${tagValue}`}
              >
                {" "}
                &times;{" "}
              </button>{" "}
            </span>
          ))}
        </div>
      </div>
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
      <div className="space-y-3 pt-4 border-t dark:border-gray-700">
        {" "}
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
      <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
        {" "}
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
          {isLoading && <FiLoader className="animate-spin h-4 w-4" />}{" "}
          {isLoading ? "Creating..." : "Create Problem"}
        </button>
      </div>
    </form>
  );
};

export default CreateProblemForm;
