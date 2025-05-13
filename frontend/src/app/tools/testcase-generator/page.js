"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { FiArrowLeft, FiAlertCircle, FiLoader, FiPlay } from "react-icons/fi";
import ProblemInput from "@/components/tools/testcase-generator/ProblemInput";
import SolutionInput from "@/components/tools/testcase-generator/SolutionInput";
import GenerationControls from "@/components/tools/testcase-generator/GenerationControls";
import ProgressDisplay from "@/components/tools/testcase-generator/ProgressDisplay";
import SynthesizedTestcasesDisplay from "@/components/tools/testcase-generator/SynthesizedTestcasesDisplay";
import ExecutionWorkflow from "@/components/tools/testcase-generator/ExecutionWorkflow"; // Import component mới

import { useToast } from "@/context/ToastProvider";
import { supportedProcessors } from "@/config/processorConfig";
import { generateTestcasesStream } from "@/utils/genApi";
import { useRouter } from "next/navigation";

const getInitialProcessor = () => {
  if (supportedProcessors.PYTHON3 && supportedProcessors.PYTHON3.processor) {
    return supportedProcessors.PYTHON3.processor;
  }
  if (Object.keys(supportedProcessors).length > 0) {
    return Object.values(supportedProcessors)[0].processor;
  }
  return "";
};

const TestcaseGeneratorPage = () => {
  const [problemDescription, setProblemDescription] = useState(
    "# Problem Title: Longest Increasing Subsequence\n\n## Description\n\nGiven an array of integers, find the length of its longest increasing subsequence (LIS).\n\nA subsequence is a sequence derived from the array by deleting some or no elements without changing the order of the remaining elements. The LIS must be **strictly increasing**.\n\n## Input\n\n```plaintext\nn\na_1 a_2 ... a_n\n```\n- First line: integer `n` (array size).\n- Second line: `n` integers `a_i`.\n\n## Output\n\n```plaintext\nLength of LIS.\n```\n\n## Constraints\n\n```math\n1 \\leq n \\leq 2500\n-10^9 \\leq a_i \\leq 10^9\n```"
  );
  const [solutionCode, setSolutionCode] = useState(
    'import sys\n\ndef main():\n    input = sys.stdin.read\n    data = input().split()\n    \n    n = int(data[0])\n    arr = list(map(int, data[1:]))\n\n    dp = [1] * n\n    for i in range(1, n):\n        for j in range(i):\n            if arr[i] > arr[j]:\n                dp[i] = max(dp[i], dp[j] + 1)\n\n    print(dp[n-1])  \n\nif __name__ == "__main__":\n    main()'
  );
  const [selectedProcessor, setSelectedProcessor] = useState(
    getInitialProcessor()
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSteps, setGenerationSteps] = useState([]);
  const [generatedTestcases, setGeneratedTestcases] = useState([]);
  const [apiError, setApiError] = useState(null);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    if (!selectedProcessor && Object.keys(supportedProcessors).length > 0) {
      setSelectedProcessor(getInitialProcessor());
    }
  }, [selectedProcessor]);

  const handleGenerate = async () => {
    if (
      !problemDescription.trim() ||
      !solutionCode.trim() ||
      !selectedProcessor
    ) {
      showToast(
        "Problem description, solution code, and processor are required.",
        "error"
      );
      return;
    }
    setIsGenerating(true);
    setApiError(null);
    setGenerationSteps([]);
    setGeneratedTestcases([]);
    let stepCounter = 0;
    generateTestcasesStream(
      {
        problem_description: problemDescription,
        solution_code: solutionCode,
        processor: selectedProcessor,
      },
      (dataFromServer) => {
        const newStep = {
          id: `step-${stepCounter++}`,
          type:
            dataFromServer.status && !dataFromServer.step
              ? "status_update"
              : "generation_step",
          payload: dataFromServer,
          timestamp: new Date(),
        };
        setGenerationSteps((prevSteps) => [...prevSteps, newStep]);
        if (
          dataFromServer.step === "synthesize_testcase" &&
          dataFromServer.data &&
          typeof dataFromServer.data === "object" &&
          dataFromServer.data.input !== undefined &&
          dataFromServer.data.category !== undefined
        ) {
          setGeneratedTestcases((prevTc) => [...prevTc, dataFromServer.data]);
        } else if (dataFromServer.step === "synthesize_testcase") {
          console.warn(
            "Received synthesize_testcase step with invalid or missing data field:",
            dataFromServer
          );
          const errorStep = {
            id: `step-error-${stepCounter++}`,
            type: "error_event",
            payload: {
              error: "Received invalid test case data from stream.",
              details: dataFromServer,
            },
            timestamp: new Date(),
          };
          setGenerationSteps((prevSteps) => [...prevSteps, errorStep]);
        }
      },
      (error) => {
        const errorMessage =
          error.message || "An error occurred during test case generation.";
        setApiError(errorMessage);
        showToast(errorMessage, "error");
        setIsGenerating(false);
      },
      () => {
        setIsGenerating(false);
        const finalStep = {
          id: `step-final-${stepCounter++}`,
          type: "status_update",
          payload: { status: "done" },
          timestamp: new Date(),
        };
        setGenerationSteps((prevSteps) => {
          const lastStepIsDone =
            prevSteps.length > 0 &&
            prevSteps[prevSteps.length - 1].payload.status === "done";
          if (
            !prevSteps.some((step) => step.payload.status === "done") &&
            !lastStepIsDone
          ) {
            return [...prevSteps, finalStep];
          }
          return prevSteps;
        });
        showToast("Test case generation stream completed.", "info");
      }
    );
  };

  const getStepTitle = (step) => {
    if (step.type === "error_event")
      return `Error Event: ${step.payload.error}`;
    if (step.type === "status_update") return `Status: ${step.payload.status}`;
    if (step.payload.step) {
      const stepName = step.payload.step
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      if (stepName === "Synthesize Testcase")
        return `${stepName} (Input Generated)`;
      return `Step: ${stepName}`;
    }
    return "Log Entry";
  };

  const currentLanguage = useMemo(
    () =>
      Object.values(supportedProcessors).find(
        (p) => p.processor === selectedProcessor
      )?.language,
    [selectedProcessor]
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-6"
        >
          <FiArrowLeft /> Back
        </button>
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-200">
          AI Test Case Generator
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col h-full">
            <ProblemInput
              value={problemDescription}
              onChange={setProblemDescription}
              isDisabled={isGenerating}
            />
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col h-full">
            <SolutionInput
              codeValue={solutionCode}
              onCodeChange={setSolutionCode}
              processorValue={selectedProcessor}
              onProcessorChange={setSelectedProcessor}
              isDisabled={isGenerating}
              currentLanguage={currentLanguage}
            />
            <div className="mt-auto pt-4">
              <GenerationControls
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            </div>
          </div>
        </div>

        {(isGenerating ||
          generationSteps.length > 0 ||
          generatedTestcases.length > 0 ||
          apiError) && (
          <div className="space-y-6">
            <div>
              <ProgressDisplay
                steps={generationSteps}
                apiError={apiError}
                getStepTitle={getStepTitle}
                isGenerating={isGenerating}
              />
            </div>
            {generatedTestcases.length > 0 && (
              <div>
                <SynthesizedTestcasesDisplay testcases={generatedTestcases} />
              </div>
            )}
          </div>
        )}

        {generationSteps.some((step) => step.payload.status === "done") &&
          !isGenerating &&
          generatedTestcases.length > 0 &&
          !apiError && (
            <ExecutionWorkflow
              generatedTestcases={generatedTestcases}
              solutionCode={solutionCode}
              selectedProcessor={selectedProcessor}
              isParentGenerating={isGenerating}
            />
          )}
      </div>
    </div>
  );
};

export default TestcaseGeneratorPage;
