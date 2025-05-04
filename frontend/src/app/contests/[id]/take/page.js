"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/utils/coreApi";
import { FiList, FiBarChart2, FiLoader, FiAlertTriangle } from "react-icons/fi";
import ProblemListTake from "@/components/contest/take/ProblemListTake";
import CountdownTimer from "@/components/contest/take/CountdownTimer";
import ParticipantLeaderboard from "@/components/contest/take/ParticipantLeaderboard";
import { useToast } from "@/context/ToastProvider";
import { useContest } from "@/context/ContestContext";
import { useAuth } from "@/context/AuthContext";

const ContestTakePage = () => {
  const { id: contestId } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { setIsInContest, setActiveContestId } = useContest();
  const { isLoggedIn, isLoading: isLoadingAuth } = useAuth();

  const [contestDetails, setContestDetails] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Problems");

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!isLoggedIn) {
        showToast("Please log in to access the contest.", "error");
        router.replace(`/login?redirect=/contests/${contestId}/take`);
      }
    }
  }, [isLoadingAuth, isLoggedIn, router, contestId, showToast]);

  useEffect(() => {
    if (!isLoadingAuth && isLoggedIn && contestId) {
      let isActive = true;
      const fetchDetails = async () => {
        setLoadingData(true);
        setError(null);
        try {
          const res = await api.get(`/contest/${contestId}/details`);
          if (isActive) {
            setContestDetails(res.data);
            setIsInContest(true);
            setActiveContestId(contestId);
          }
        } catch (err) {
          console.error("Failed to fetch contest details:", err);
          if (isActive) {
            setError(
              err.response?.data?.message || "Failed to load contest details."
            );
            setIsInContest(false);
            setActiveContestId(null);
          }
          if (err.response?.status === 404 || err.response?.status === 403) {
            showToast("Contest not found or access denied.", "error");
          }
        } finally {
          if (isActive) {
            setLoadingData(false);
          }
        }
      };
      fetchDetails();

      return () => {
        isActive = false;
        setIsInContest(false);
        setActiveContestId(null);
      };
    } else if (!isLoadingAuth && !isLoggedIn) {
      setLoadingData(false);
    } else if (!contestId) {
      setError("Contest ID is missing.");
      setLoadingData(false);
      setIsInContest(false);
      setActiveContestId(null);
    }
  }, [
    isLoadingAuth,
    isLoggedIn,
    contestId,
    setIsInContest,
    setActiveContestId,
    showToast,
  ]);

  if (isLoadingAuth) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-var(--header-height,8rem))]">
        <FiLoader className="animate-spin text-4xl text-blue-500" />
        <span className="ml-3">Checking authentication...</span>
      </div>
    );
  }
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,8rem))] text-red-500 px-4">
        <FiAlertTriangle className="text-5xl mb-3" />
        <p className="text-center">Redirecting to login...</p>
      </div>
    );
  }
  if (loadingData) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-var(--header-height,8rem))]">
        <FiLoader className="animate-spin text-4xl text-blue-500" />
        <span className="ml-3">Loading contest data...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,8rem))] text-red-500 px-4">
        <FiAlertTriangle className="text-5xl mb-3" />
        <p className="text-center">{error}</p>
        <Link
          href="/contests"
          className="mt-5 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Contests List
        </Link>
      </div>
    );
  }
  if (!contestDetails) {
    return <p className="text-center mt-10">Contest data not available.</p>;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 max-w-7xl">
      {contestDetails?.end_time && (
        <CountdownTimer
          endTime={contestDetails.end_time}
          className="fixed top-[calc(var(--header-height,4rem)+1rem)] right-4 z-50 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
        />
      )}
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
        {contestDetails.title}
      </h1>
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-300 dark:border-gray-700 sticky top-16 bg-white dark:bg-gray-900 z-30 py-2 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400 justify-center sm:justify-start">
            <li className="me-2">
              <button
                onClick={() => setActiveTab("Problems")}
                className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group ${
                  activeTab === "Problems"
                    ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500 active font-semibold" // Added font-semibold
                    : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <FiList className="me-2" /> Problems
              </button>
            </li>
            <li className="me-2">
              <button
                onClick={() => setActiveTab("Leaderboard")}
                className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group ${
                  activeTab === "Leaderboard"
                    ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500 active font-semibold" // Added font-semibold
                    : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <FiBarChart2 className="me-2" /> Leaderboard
              </button>
            </li>
          </ul>
        </div>
      </div>
      {/* Tab Content */}
      <div className="max-w-6xl mx-auto mt-6">
        {activeTab === "Problems" && (
          <div>
            <ProblemListTake
              problems={contestDetails.problems || []}
              contestId={contestId}
            />
          </div>
        )}
        {activeTab === "Leaderboard" && (
          <div>
            <ParticipantLeaderboard contestId={contestId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestTakePage;
