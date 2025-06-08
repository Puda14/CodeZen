"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiAlertCircle,
  FiLoader,
  FiPlay,
  FiLogIn,
} from "react-icons/fi";

import ProblemInput from "@/components/tools/testcase-generator/ProblemInput";
import SolutionInput from "@/components/tools/testcase-generator/SolutionInput";
import GenerationControls from "@/components/tools/testcase-generator/GenerationControls";
import ProgressDisplay from "@/components/tools/testcase-generator/ProgressDisplay";
import SynthesizedTestcasesDisplay from "@/components/tools/testcase-generator/SynthesizedTestcasesDisplay";
import ExecutionWorkflow from "@/components/tools/testcase-generator/ExecutionWorkflow";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastProvider";
import { supportedProcessors } from "@/config/processorConfig";
import { generateTestcasesStream } from "@/utils/genApi";

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
  const { isLoggedIn, isLoading: isLoadingAuth } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const hasCheckedAuth = useRef(false);

  const [problemDescription, setProblemDescription] = useState(
    "# Problem Title: Longest Increasing Subsequence\n\n## Description\n\nGiven an array of integers, find the length of its longest increasing subsequence (LIS).\n\nA subsequence is a sequence derived from the array by deleting some or no elements without changing the order of the remaining elements. The LIS must be **strictly increasing**.\n\n## Input\n\n```plaintext\nn\na_1 a_2 ... a_n\n```\n- First line: integer `n` (array size).\n- Second line: `n` integers `a_i`.\n\n## Output\n\n```plaintext\nLength of LIS.\n```\n\n## Constraints\n\n```math\n1 \\leq n \\leq 2500\n-10^9 \\leq a_i \\leq 10^9\n```"
  );
  const [solutionCode, setSolutionCode] = useState(
    "import bisect\n\nn = int(input())\nnums = list(map(int, input().split()))\ntails = []\n\nfor num in nums:\n    idx = bisect.bisect_left(tails, num)\n    if idx == len(tails):\n        tails.append(num)\n    else:\n        tails[idx] = num\n\nprint(len(tails))"
  );
  const [selectedProcessor, setSelectedProcessor] = useState(
    getInitialProcessor()
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSteps, setGenerationSteps] = useState([]);
  const [generatedTestcases, setGeneratedTestcases] = useState([]);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (!isLoadingAuth && !isLoggedIn && !hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      showToast("Please log in to use the Test Case Generator.", "warning");
      router.push("/login?redirect=/tools/testcase-generator");
    }
  }, [isLoggedIn, isLoadingAuth, router, showToast]);

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

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-8">
        <FiLoader className="animate-spin text-4xl text-blue-500" />
        <p className="mt-4 text-gray-700 dark:text-gray-300">
          Loading authentication...
        </p>
      </div>
    );
  }

  if (!isLoggedIn && !isLoadingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-8 text-center">
        <FiLogIn size={48} className="text-blue-500 mb-4" />
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You need to be logged in to use the AI Test Case Generator.
        </p>
        <Link
          href="/login?redirect=/tools/testcase-generator"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-150 ease-in-out"
        >
          Log In
        </Link>
      </div>
    );
  }

  if (isLoggedIn && !isLoadingAuth) {
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
  }

  return null;
};

export default TestcaseGeneratorPage;
