"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiPlus,
  FiTrash2,
  FiLoader,
  FiInfo,
  FiTag,
  FiUploadCloud,
  FiDownload,
} from "react-icons/fi";
import api from "@/utils/coreApi";
import { useToast } from "@/context/ToastProvider";
import { Difficulty } from "@/enums/difficulty.enum";
import { Tags } from "@/enums/tags.enum";
import MarkdownEditorWithPreview from "@/components/common/MarkdownEditorWithPreview";
import NewTestcaseInput from "@/components/contest/owner/problem/NewTestcaseInput";
import {
  submissionLimits,
  testcaseTimeoutLimits,
  testcaseScoreLimits,
} from "@/config/contestConfig";
import { processContestZip } from "@/utils/contestZipProcessor";

const tagColors = [
  "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100",
  "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100",
  "bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-100",
  "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-100",
  "bg-pink-100 text-pink-700 dark:bg-pink-800 dark:text-pink-100",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-100",
];

const ProblemInputGroup = ({
  problem,
  index: problemIndex,
  onChange,
  onRemove,
  isSaving,
}) => {
  const toastContextValue = useToast();
  const toast = toastContextValue?.showToast;
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState([]);

  const handleProblemFieldChange = (field, value) => {
    if (field === "maxSubmissions") {
      let processedValue = value;
      if (value !== "") {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue)) {
          return;
        }
        if (numValue < submissionLimits.min) {
          processedValue = submissionLimits.min;
        } else if (numValue > submissionLimits.max) {
          processedValue = submissionLimits.max;
        } else {
          processedValue = numValue;
        }
      }
      onChange(problemIndex, field, processedValue);
    } else {
      onChange(problemIndex, field, value);
    }
  };

  const handleTestcaseChange = (testcaseIndex, field, value) => {
    const updatedTestcases = (problem.testcases || []).map((tc, idx) =>
      idx === testcaseIndex ? { ...tc, [field]: value } : tc
    );
    onChange(problemIndex, "testcases", updatedTestcases);
  };

  const addTestcaseRow = () => {
    const newTestcases = [
      ...(problem.testcases || []),
      {
        input: "",
        output: "",
        score: testcaseScoreLimits.default,
        isPublic: false,
        timeout: testcaseTimeoutLimits.default,
      },
    ];
    onChange(problemIndex, "testcases", newTestcases);
  };

  const removeTestcaseRow = (testcaseIndex) => {
    if (!problem.testcases || problem.testcases.length <= 1) {
      toast?.("Problem needs at least one testcase.", "warning");
      return;
    }
    const newTestcases = problem.testcases.filter(
      (_, idx) => idx !== testcaseIndex
    );
    onChange(problemIndex, "testcases", newTestcases);
  };

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    setTagInput(value);
    if (value.trim() && typeof Tags === "object") {
      const lowerCaseValue = value.toLowerCase();
      const currentTags = problem.tags || [];
      const suggestions = Object.keys(Tags).filter(
        (tagKey) =>
          (tagKey.toLowerCase().includes(lowerCaseValue) ||
            (Tags[tagKey] &&
              Tags[tagKey].toLowerCase().includes(lowerCaseValue))) &&
          !currentTags.includes(tagKey)
      );
      setTagSuggestions(suggestions);
    } else {
      setTagSuggestions([]);
    }
  };

  const handleAddTag = (tagKeyToAdd) => {
    const trimmedTagKey = tagKeyToAdd?.trim();
    const isValidKey = Object.keys(Tags).some((key) => key === trimmedTagKey);

    if (!isValidKey) {
      if (trimmedTagKey)
        toast?.(
          `Tag "${trimmedTagKey}" is not valid. Please select from suggestions.`,
          "warning"
        );
      setTagInput("");
      setTagSuggestions([]);
      return;
    }
    const currentTags = problem.tags || [];
    if (!currentTags.includes(trimmedTagKey)) {
      onChange(problemIndex, "tags", [...currentTags, trimmedTagKey]);
    }
    setTagInput("");
    setTagSuggestions([]);
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const valueToMatch = tagInput.trim().toLowerCase();
      let exactMatchKey = Object.keys(Tags || {}).find(
        (key) => key.toLowerCase() === valueToMatch
      );
      if (!exactMatchKey) {
        for (const key in Tags) {
          if (Tags[key].toLowerCase() === valueToMatch) {
            exactMatchKey = key;
            break;
          }
        }
      }

      if (exactMatchKey) {
        handleAddTag(exactMatchKey);
      } else if (tagSuggestions.length > 0) {
        handleAddTag(tagSuggestions[0]);
      } else {
        toast?.(`Tag "${tagInput.trim()}" is not a valid tag.`, "warning");
        setTagInput("");
        setTagSuggestions([]);
      }
    }
  };

  const handleRemoveTag = (tagKeyToRemove) => {
    const newTags = (problem.tags || []).filter(
      (tagKey) => tagKey !== tagKeyToRemove
    );
    onChange(problemIndex, "tags", newTags);
  };

  return (
    <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600 space-y-4 mt-4 relative">
      <button
        type="button"
        onClick={() => onRemove(problemIndex)}
        className="absolute top-2 right-2 text-red-500 hover:text-red-700 disabled:opacity-50 p-1"
        disabled={isSaving}
        title="Remove this problem"
      >
        <FiTrash2 size={18} />
      </button>
      <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
        Problem #{problemIndex + 1}
      </h4>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Problem Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={problem.name || ""}
          onChange={(e) => handleProblemFieldChange("name", e.target.value)}
          required
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
          disabled={isSaving}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Difficulty <span className="text-red-500">*</span>
          </label>
          <select
            value={problem.difficulty || Difficulty.NORMAL}
            onChange={(e) =>
              handleProblemFieldChange("difficulty", e.target.value)
            }
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSaving}
          >
            {Object.values(Difficulty).map((level) => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor={`maxSubmissions-${problemIndex}`}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Max Submissions <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id={`maxSubmissions-${problemIndex}`}
            name="maxSubmissions"
            value={problem.maxSubmissions ?? ""}
            onChange={(e) =>
              handleProblemFieldChange("maxSubmissions", e.target.value)
            }
            required
            min={submissionLimits.min}
            max={submissionLimits.max}
            step="1"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            disabled={isSaving}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Must be between {submissionLimits.min} and {submissionLimits.max}.
          </p>
        </div>
      </div>

      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tags <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={handleTagInputChange}
            onKeyDown={handleTagKeyDown}
            placeholder="Type tag key (e.g., DP) and press Enter"
            className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSaving}
            autoComplete="off"
          />
        </div>
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
                {Tags[tagKey] || tagKey}{" "}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2 min-h-[24px] mt-2">
          {(problem.tags || []).map((tagKey, idx) => (
            <span
              key={`${tagKey}-${idx}`}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                tagColors[idx % tagColors.length]
              }`}
            >
              <FiTag size={12} /> {Tags[tagKey] || tagKey}{" "}
              <button
                type="button"
                onClick={() => handleRemoveTag(tagKey)}
                className="ml-1 opacity-70 hover:opacity-100"
                disabled={isSaving}
                aria-label={`Remove tag ${Tags[tagKey] || tagKey}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description (Markdown) <span className="text-red-500">*</span>
        </label>
        <MarkdownEditorWithPreview
          value={problem.content || ""}
          onChange={(value) => handleProblemFieldChange("content", value)}
          isDisabled={isSaving}
          minHeight="400px"
        />
      </div>
      <div className="space-y-3 pt-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Testcases <span className="text-red-500">*</span>
        </label>
        {(problem.testcases || []).map((tc, i) => (
          <NewTestcaseInput
            key={`p${problemIndex}-tc-${i}`}
            testcase={tc}
            index={i}
            onChange={handleTestcaseChange}
            onRemove={removeTestcaseRow}
            isSaving={isSaving}
          />
        ))}
        <button
          type="button"
          onClick={addTestcaseRow}
          className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
          disabled={isSaving}
        >
          <FiPlus size={16} /> Add Testcase
        </button>
      </div>
    </div>
  );
};

const CreateContestForm = () => {
  const router = useRouter();
  const toastContextValue = useToast();
  const toast = toastContextValue?.showToast;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [leaderboardStatus, setLeaderboardStatus] = useState("open");
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [templateContent, setTemplateContent] = useState("");
  const [templateError, setTemplateError] = useState(false);

  const generateClientId = () =>
    `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch("/tmp_problem_des.md");
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        setTemplateContent(text);
      } catch (error) {
        setTemplateError(true);
        setTemplateContent(
          `# Problem Title\n\n## Description\n\nTask description here. Be clear and concise.\n\n## Input Format\n\nDescription of the input format.\n\n## Output Format\n\nDescription of the output format.\n\n## Constraints\n\n- $1 \\le N \\le 10^5$\n- $1 \\le Q \\le 10^5$\n\n## Example\n\n### Input\n\`\`\`\nExample Input\n\`\`\`\n\n### Output\n\`\`\`\nExample Output\n\`\`\`\n\n## Notes (Optional)\n\nAny additional notes or hints.`
        );
        toast?.(
          "Could not load problem template file. Using default.",
          "warning"
        );
      }
    };
    fetchTemplate();
  }, [toast]);

  const addProblem = () => {
    setProblems((prevProblems) => [
      ...prevProblems,
      {
        id: generateClientId(),
        name: "",
        content: templateContent,
        difficulty: Difficulty.NORMAL,
        tags: [],
        maxSubmissions: submissionLimits.default,
        testcases: [
          {
            input: "",
            output: "",
            score: testcaseScoreLimits.default,
            isPublic: true,
            timeout: testcaseTimeoutLimits.default,
          },
        ],
      },
    ]);
  };

  const removeProblem = (idToRemove) => {
    if (problems.length === 0) return;
    setProblems((currentProblems) =>
      currentProblems.filter((p) => p.id !== idToRemove)
    );
  };

  const updateProblem = useCallback((problemIdOrIndex, field, value) => {
    setProblems((currentProblems) =>
      currentProblems.map((p, idx) => {
        if (idx === problemIdOrIndex) {
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  }, []);

  const handleZipFileImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".zip")) {
      toast?.("Please upload a .zip file.", "error");
      event.target.value = null;
      return;
    }

    setIsImporting(true);
    toast?.("Processing contest package...", "info", { duration: null });

    try {
      const result = await processContestZip(file, templateContent);
      if (result.success && result.data) {
        const {
          title: newTitle,
          description: newDesc,
          startTime: newStart,
          endTime: newEnd,
          isPublic: newIsPublic,
          leaderboardStatus: newLeaderboard,
          problems: newProblemsFromZip,
        } = result.data;

        setTitle(newTitle || "");
        setDescription(newDesc || "");
        setStartTime(newStart || "");
        setEndTime(newEnd || "");
        setIsPublic(typeof newIsPublic === "boolean" ? newIsPublic : true);
        setLeaderboardStatus(newLeaderboard || "open");

        setProblems(
          newProblemsFromZip.map((p_from_zip) => ({
            id: generateClientId(),
            name: p_from_zip.name || "",
            content: p_from_zip.content || templateContent,
            difficulty: p_from_zip.difficulty || Difficulty.NORMAL,
            tags: p_from_zip.tags || [],
            maxSubmissions:
              p_from_zip.maxSubmissions === undefined
                ? submissionLimits.default
                : p_from_zip.maxSubmissions,
            testcases: (p_from_zip.testcases || []).map((tc) => ({
              input: tc.input || "",
              output: tc.output || "",
              score:
                tc.score === undefined
                  ? testcaseScoreLimits.default
                  : Number(tc.score),
              isPublic: typeof tc.isPublic === "boolean" ? tc.isPublic : false,
              timeout:
                tc.timeout === undefined
                  ? testcaseTimeoutLimits.default
                  : Number(tc.timeout),
            })),
          }))
        );

        toast?.(
          "Contest data imported successfully! Please review and save.",
          "success"
        );
      } else {
        throw new Error(result.error || "Failed to parse contest package.");
      }
    } catch (error) {
      toast?.(`Import failed: ${error.message}`, "error");
    } finally {
      setIsImporting(false);
      event.target.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast?.("Contest title is required.", "error");
      return;
    }
    if (!startTime || !endTime) {
      toast?.("Start time and end time are required.", "error");
      return;
    }

    let startDate, endDate, startTimeISO, endTimeISO;
    try {
      startDate = new Date(startTime);
      endDate = new Date(endTime);
      if (isNaN(startDate.getTime())) {
        toast?.("Invalid Start Time.", "error");
        return;
      }
      if (isNaN(endDate.getTime())) {
        toast?.("Invalid End Time.", "error");
        return;
      }
      if (startDate >= endDate) {
        toast?.("End time must be after start time.", "error");
        return;
      }
      startTimeISO = startDate.toISOString();
      endTimeISO = endDate.toISOString();
    } catch (error) {
      toast?.("Error processing times. Please check the format.", "error");
      return;
    }

    if (problems.length === 0) {
      toast?.("At least one problem is required.", "error");
      return;
    }

    for (const [index, p] of problems.entries()) {
      if (!p.name?.trim()) {
        toast?.(`Name for problem #${index + 1} is required.`, "error");
        return;
      }
      if (!p.content?.trim()) {
        toast?.(`Description for problem #${index + 1} is required.`, "error");
        return;
      }
      if (!p.tags || p.tags.length === 0) {
        toast?.(
          `At least one tag is required for problem #${index + 1}.`,
          "error"
        );
        return;
      }
      const maxSubs = p.maxSubmissions;
      if (
        maxSubs === undefined ||
        maxSubs === null ||
        String(maxSubs).trim() === "" ||
        isNaN(parseInt(maxSubs, 10)) ||
        parseInt(maxSubs, 10) < submissionLimits.min ||
        parseInt(maxSubs, 10) > submissionLimits.max
      ) {
        toast?.(
          `Max submissions for problem #${index + 1} must be a number between ${
            submissionLimits.min
          } and ${submissionLimits.max}.`,
          "error"
        );
        return;
      }
      if (!p.testcases || p.testcases.length === 0) {
        toast?.(`Testcases are required for problem #${index + 1}.`, "error");
        return;
      }

      for (const [tcIndex, tc] of p.testcases.entries()) {
        if (tc.input?.trim() === "" && tc.output?.trim() === "") {
        } else if (
          (tc.input?.trim() && !tc.output?.trim()) ||
          (!tc.input?.trim() && tc.output?.trim())
        ) {
          toast?.(
            `Both Input and Output are typically required for testcase #${
              tcIndex + 1
            } in problem #${index + 1}, or both should be empty.`,
            "warning"
          );
        }

        const timeoutVal = tc.timeout;
        if (
          timeoutVal === undefined ||
          timeoutVal === null ||
          String(timeoutVal).trim() === "" ||
          isNaN(parseInt(timeoutVal, 10)) ||
          parseInt(timeoutVal, 10) < testcaseTimeoutLimits.min ||
          parseInt(timeoutVal, 10) > testcaseTimeoutLimits.max
        ) {
          toast?.(
            `Timeout for testcase #${tcIndex + 1} in problem #${
              index + 1
            } must be a number between ${testcaseTimeoutLimits.min} and ${
              testcaseTimeoutLimits.max
            } seconds.`,
            "error"
          );
          return;
        }
        const scoreVal = tc.score;
        if (
          scoreVal === undefined ||
          scoreVal === null ||
          String(scoreVal).trim() === "" ||
          isNaN(parseFloat(scoreVal)) ||
          parseFloat(scoreVal) < (testcaseScoreLimits?.min ?? 1) ||
          parseFloat(scoreVal) > (testcaseScoreLimits?.max ?? 100)
        ) {
          toast?.(
            `Score for testcase #${tcIndex + 1} in problem #${
              index + 1
            } must be a number between ${testcaseScoreLimits?.min ?? 1} and ${
              testcaseScoreLimits?.max ?? 100
            }.`,
            "error"
          );
          return;
        }
      }
    }

    setIsLoading(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      start_time: startTimeISO,
      end_time: endTimeISO,
      status: "upcoming",
      isPublic,
      leaderboardStatus,
      problems: problems.map((p) => ({
        name: p.name.trim(),
        content: p.content.trim(),
        difficulty: p.difficulty,
        tags: (p.tags || []).map((tagKey) => Tags[tagKey]).filter(Boolean),
        maxSubmissions: parseInt(p.maxSubmissions, 10),
        testcases: (p.testcases || []).map((tc) => ({
          input: tc.input?.trim() ?? "",
          output: tc.output?.trim() ?? "",
          score: Number(tc.score) || 0,
          isPublic: tc.isPublic === true,
          timeout: parseInt(tc.timeout, 10),
        })),
      })),
    };

    try {
      console.log(
        "Submitting Contest Payload:",
        JSON.stringify(payload, null, 2)
      );
      const response = await api.post("/contest/create", payload);
      if (
        response.data &&
        (response.status === 201 || response.status === 200)
      ) {
        toast?.("Contest created successfully!", "success");
        router.push("/contests");
      } else {
        const serverMessage =
          response.data?.message ||
          response.data?.problem?.message ||
          "Contest creation failed due to an unknown server error.";
        throw new Error(serverMessage);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "An unknown error occurred while creating the contest.";
      toast?.(`Failed to create contest: ${errorMessage}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-none">
      <div className="mb-6 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
          <FiUploadCloud className="mr-2 text-xl text-blue-500 dark:text-blue-400" />{" "}
          Import Contest from ZIP
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Upload a .zip file containing the contest structure (
          <code>contest.json</code>, problem folders with{" "}
          <code>problem.md</code>, optional <code>config.json</code>, and{" "}
          <code>testcases/</code>). Times in <code>contest.json</code> should be
          in your local timezone format <code>YYYY-MM-DDTHH:MM:SS</code>.
        </p>
        <div className="flex items-center gap-4">
          <input
            type="file"
            id="zip-upload"
            accept=".zip"
            onChange={handleZipFileImport}
            className="block w-full text-sm text-gray-500 dark:text-gray-400
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-100 file:text-blue-700
                       dark:file:bg-blue-700/30 dark:file:text-blue-200
                       hover:file:bg-blue-200 dark:hover:file:bg-blue-600/40
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                       disabled:opacity-50 cursor-pointer flex-grow"
            disabled={isLoading || isImporting}
          />
          <a
            href="/contest_template.zip"
            download="Contest_Template.zip"
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-500 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800 focus:ring-gray-400 whitespace-nowrap"
            title="Download contest structure template"
          >
            <FiDownload className="h-4 w-4" />
            Template
          </a>
        </div>
        {isImporting && (
          <div className="mt-3 flex items-center text-sm text-blue-600 dark:text-blue-400">
            <FiLoader className="animate-spin mr-2 h-4 w-4" />
            <span>Importing contest data... please wait.</span>
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="contestTitle"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Contest Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="contestTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading || isImporting}
          placeholder="e.g., Weekly Coding Challenge #1"
        />
      </div>
      <div>
        <label
          htmlFor="contestDescription"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Description
        </label>
        <textarea
          id="contestDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 resize-y"
          disabled={isLoading || isImporting}
          placeholder="Provide a brief overview of the contest, rules, or any other relevant information."
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="startTime"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Start Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading || isImporting}
          />
        </div>
        <div>
          <label
            htmlFor="endTime"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            End Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading || isImporting}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-indigo-500 dark:focus:ring-indigo-600"
            disabled={isLoading || isImporting}
          />
          <label
            htmlFor="isPublic"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Publicly Visible Contest
          </label>
          <FiInfo
            size={14}
            className="text-gray-400 dark:text-gray-500 flex-shrink-0 cursor-help"
            title="If checked, anyone can see and register for this contest (if registration is open). If unchecked, it's a private contest."
          />
        </div>
        <div>
          <label
            htmlFor="leaderboardStatus"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Leaderboard Status
          </label>
          <select
            id="leaderboardStatus"
            value={leaderboardStatus}
            onChange={(e) => setLeaderboardStatus(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading || isImporting}
          >
            <option value="open">
              Open (Visible during and after contest)
            </option>
            <option value="frozen">
              Frozen (Visible but not updated during last hour)
            </option>
            <option value="closed">
              Closed (Not visible until after contest ends)
            </option>
          </select>
        </div>
      </div>
      <div className="space-y-4 pt-4 border-t dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Problems <span className="text-red-500">*</span>
        </h3>
        {templateError && (
          <p className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-700/30 p-3 rounded-md">
            Warning: Could not load problem description template. A fallback is
            used.
          </p>
        )}
        {problems.map((p, index) => (
          <ProblemInputGroup
            key={p.id || `fallback-problem-${index}`}
            problem={p}
            index={index}
            onChange={updateProblem}
            onRemove={() => removeProblem(p.id)}
            isSaving={isLoading || isImporting}
          />
        ))}
        <button
          type="button"
          onClick={addProblem}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-3 w-full justify-center hover:border-blue-500 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70"
          disabled={
            isLoading || isImporting || (!templateContent && !templateError)
          }
        >
          <FiPlus size={16} /> Add Problem
        </button>
      </div>
      <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 dark:border-gray-500 rounded shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800 focus:ring-gray-400"
          disabled={isLoading || isImporting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:opacity-50 flex items-center gap-2"
          disabled={isLoading || isImporting}
        >
          {(isLoading || isImporting) && (
            <FiLoader className="animate-spin h-4 w-4" />
          )}{" "}
          {isLoading || isImporting ? "Processing..." : "Create Contest"}
        </button>
      </div>
    </form>
  );
};

export default CreateContestForm;
