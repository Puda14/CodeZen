"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FiLoader, FiAlertTriangle, FiArrowLeft, FiTag } from "react-icons/fi";
import api from "@/utils/coreApi";

import ProblemDescription from "@/components/ProblemDescription";
import InputOutput from "@/components/InputOutput";
import ExecuteButtons from "@/components/ExecuteButtons";
import TestcaseResults from "@/components/TestcaseResults";
import MonacoCodeEditor from "@/components/MonacoCodeEditor";
import CountdownTimer from "@/components/contest/take/CountdownTimer";

import useFetchProblem from "@/hooks/useFetchProblem";
import useCodeExecution from "@/hooks/useCodeExecution";
import { useContest } from "@/context/ContestContext";
import { useToast } from "@/context/ToastProvider";
import { useAuth } from "@/context/AuthContext";

const getDifficultyClass = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "normal":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "hard":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "very hard":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }
};

const tagClass =
  "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1";

const ContestProblemDetailPage = () => {
  const { id: contestId, problemId } = useParams();
  const router = useRouter();
  const { setIsInContest, setActiveContestId } = useContest();
  const { showToast } = useToast();
  const { isLoggedIn, isLoading: isLoadingAuth } = useAuth();

  const {
    problemData,
    isLoading: isLoadingProblem,
    error: problemError,
  } = useFetchProblem(contestId, problemId, isLoggedIn);

  const [contestEndTime, setContestEndTime] = useState(null);
  const [isLoadingEndTime, setIsLoadingEndTime] = useState(true);

  const {
    selectedKey,
    setSelectedKey,
    code,
    setCode,
    inputData,
    setInputData,
    output,
    handleExecute,
    submissionResult,
    handleContestSubmit,
    isLoadingRun,
    isLoadingSubmit,
  } = useCodeExecution(contestId, problemId);

  useEffect(() => {
    if (!isLoadingAuth && !isLoggedIn) {
      showToast("Please log in to view this problem.", "error");
      router.replace(
        `/login?redirect=/contests/${contestId}/problem/${problemId}`
      );
    }
  }, [isLoadingAuth, isLoggedIn, router, contestId, problemId, showToast]);

  useEffect(() => {
    if (
      !isLoadingAuth &&
      isLoggedIn &&
      contestId &&
      problemId &&
      !problemError
    ) {
      setIsInContest(true);
      setActiveContestId(contestId);
    } else {
      setIsInContest(false);
      setActiveContestId(null);
    }
    return () => {
      setIsInContest(false);
      setActiveContestId(null);
    };
  }, [
    isLoadingAuth,
    isLoggedIn,
    contestId,
    problemId,
    problemError,
    setIsInContest,
    setActiveContestId,
  ]);

  useEffect(() => {
    let isActive = true;
    if (!isLoadingAuth && isLoggedIn && contestId) {
      const fetchEndTime = async () => {
        setIsLoadingEndTime(true);
        try {
          const res = await api.get(`/contest/${contestId}/details`);
          if (isActive && res.data?.end_time) {
            setContestEndTime(res.data.end_time);
          } else if (isActive) {
            console.warn("Contest end time not found.");
            showToast("Could not load contest timer data.", "warning");
          }
        } catch (err) {
          console.error("Failed to fetch contest end time:", err);
          if (isActive) showToast("Error loading contest timer.", "error");
        } finally {
          if (isActive) setIsLoadingEndTime(false);
        }
      };
      fetchEndTime();
    } else {
      setIsLoadingEndTime(false);
    }
    return () => {
      isActive = false;
    };
  }, [isLoadingAuth, isLoggedIn, contestId, showToast]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.returnValue =
        "Bạn đang trong một cuộc thi. Rời khỏi trang có thể làm mất tiến trình.";
      return event.returnValue;
    };
    if (!isLoadingAuth && isLoggedIn && problemData) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isLoadingAuth, isLoggedIn, problemData]);

  if (isLoadingAuth || isLoadingProblem || isLoadingEndTime) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-var(--header-height,8rem))]">
        <FiLoader className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,8rem))] text-red-500 px-4">
        <FiAlertTriangle className="text-5xl mb-3" />
        <p className="text-center">Please log in to view this problem.</p>
        <Link
          href="/login"
          className="mt-5 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  if (problemError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,8rem))] text-red-500 px-4">
        <FiAlertTriangle className="text-5xl mb-3" />
        <p className="text-center">{problemError}</p>
        <Link
          href={`/contests/${contestId}/take`}
          className="mt-5 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Problems List
        </Link>
      </div>
    );
  }

  if (!problemData) {
    return (
      <p className="text-center mt-10">Problem data could not be loaded.</p>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 max-w-full relative">
      {contestEndTime && (
        <CountdownTimer
          endTime={contestEndTime}
          className="fixed top-[calc(var(--header-height,4rem)+1rem)] right-4 z-50 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
        />
      )}

      <button
        onClick={() => router.push(`/contests/${contestId}/take`)}
        className="absolute top-[calc(var(--header-height,4rem)+1rem)] left-4 mb-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition z-20 bg-white dark:bg-gray-800 px-3 py-1 rounded-md shadow"
      >
        <FiArrowLeft size={18} />
        Problem List
      </button>

      <div className="flex flex-col lg:flex-row gap-6 mt-12 lg:mt-8">
        <div className="lg:w-7/12 xl:w-6/12 flex-shrink-0">
          <div className="sticky top-[calc(var(--header-height,4rem)+4rem)] max-h-[calc(100vh-var(--header-height,4rem)-5rem)] overflow-y-auto bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">
              {problemData.name}
            </h2>
            <div className="mb-4 flex flex-wrap gap-2">
              {problemData.difficulty && (
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded ${getDifficultyClass(
                    problemData.difficulty
                  )}`}
                >
                  {problemData.difficulty}
                </span>
              )}
              {problemData.tags &&
                problemData.tags.length > 0 &&
                problemData.tags.map((tag, tagIndex) => (
                  <span key={tagIndex} className={tagClass}>
                    {" "}
                    <FiTag size={12} /> {tag}{" "}
                  </span>
                ))}
            </div>
            <ProblemDescription
              problemDescription={problemData.content || ""}
            />
          </div>
        </div>

        <div className="lg:w-5/12 xl:w-6/12 flex flex-col space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-1">
            <MonacoCodeEditor
              code={code}
              onChange={setCode}
              selectedKey={selectedKey}
              setSelectedKey={setSelectedKey}
            />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
            <InputOutput
              inputData={inputData}
              setInputData={setInputData}
              output={output}
            />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
            <ExecuteButtons
              selectedKey={selectedKey}
              setSelectedKey={setSelectedKey}
              handleExecute={handleExecute}
              handleContestSubmit={handleContestSubmit}
              isLoadingRun={isLoadingRun}
              isLoadingSubmit={isLoadingSubmit}
            />
          </div>
          {submissionResult && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
              <TestcaseResults
                submissionResult={submissionResult}
                originalTestcases={problemData?.testcases || []}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContestProblemDetailPage;
