"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiLoader,
  FiList,
  FiUsers,
  FiBarChart2,
  FiSettings,
  FiFileText,
  FiAlertTriangle,
  FiPieChart,
  FiGitMerge,
} from "react-icons/fi";
import api from "@/utils/coreApi";
import ContestInfo from "@/components/contest/owner/ContestInfo";
import RegistrationTable from "@/components/contest/owner/RegistrationTable";
import ProblemList from "@/components/contest/owner/ProblemList";
import OwnerLeaderboard from "@/components/contest/owner/OwnerLeaderboard";
import OwnerSubmissionsList from "@/components/contest/owner/OwnerSubmissionsList";
import ContestAnalyticsTab from "@/components/contest/owner/ContestAnalyticsTab";
import ContestCheckCodeTab from "@/components/contest/owner/ContestCheckCodeTab";

const TABS = [
  { name: "Settings", icon: FiSettings },
  { name: "Problems", icon: FiList },
  { name: "Registrations", icon: FiUsers },
  { name: "Leaderboard", icon: FiBarChart2 },
  { name: "Submissions", icon: FiFileText },
  { name: "Analytics", icon: FiPieChart },
  { name: "Check Code", icon: FiGitMerge },
];

const ContestDetailOwnerPage = () => {
  const { id: contestId } = useParams();
  const router = useRouter();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(TABS[0].name);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setContest(null);
    try {
      const res = await api.get(`/contest/${contestId}/owner`);
      setContest(res.data);
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        setError("Contest not found or access denied.");
      } else {
        setError(
          "Failed to load contest data. Please try refreshing the page."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    if (contestId) {
      fetchData();
    } else {
      setError("Contest ID is missing from URL.");
      setLoading(false);
    }
  }, [contestId, fetchData]);

  const handleContestDataRefresh = useCallback(() => {
    console.log(
      "Refreshing main contest data due to child component update..."
    );
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-var(--header-height,8rem))] text-gray-700 dark:text-gray-300">
        <FiLoader className="animate-spin text-4xl text-blue-500" />
        <span className="mt-3 text-lg">Loading Contest Panel...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,8rem))] text-red-500 px-4">
        <FiAlertTriangle className="text-5xl mb-3" />
        <p className="text-center text-lg">{error}</p>
        <button
          onClick={() => router.push("/contests")} // Có thể đổi về /contests/owned
          className="mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-colors"
        >
          Back to Contests
        </button>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,8rem))] text-gray-500 px-4">
        <FiAlertTriangle className="text-5xl mb-3 text-yellow-500" />
        <p className="text-center text-lg">
          Contest data is unavailable or could not be loaded.
        </p>
        <p className="text-center text-sm mt-1">
          Please try again or contact support if the issue persists.
        </p>
        <button
          onClick={() => router.push("/contests")}
          className="mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Contests
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 max-w-7xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
          title="Go back"
        >
          <FiArrowLeft size={18} />
          <span>Back</span>
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 text-center flex-grow order-first sm:order-none w-full sm:w-auto">
          {contest.title} - Owner Panel
        </h1>
        <div className="w-16 hidden sm:block" aria-hidden="true"></div>{" "}
      </div>

      <div className="mb-6 border-b border-gray-300 dark:border-gray-700 sticky top-16 bg-white dark:bg-gray-900 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <ul
            className="flex flex-nowrap overflow-x-auto -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400"
            role="tablist"
          >
            {TABS.map((tab) => (
              <li
                key={tab.name}
                className="me-2 flex-shrink-0"
                role="presentation"
              >
                <button
                  id={`tab-${tab.name.toLowerCase()}`}
                  onClick={() => setActiveTab(tab.name)}
                  role="tab"
                  aria-selected={activeTab === tab.name}
                  aria-controls={`tabpanel-${tab.name.toLowerCase()}`}
                  className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group whitespace-nowrap ${
                    activeTab === tab.name
                      ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500 active font-semibold"
                      : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <tab.icon className="me-2 w-4 h-4" aria-hidden="true" />{" "}
                  {tab.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "Settings" && (
          <div
            role="tabpanel"
            id="tabpanel-settings"
            aria-labelledby="tab-settings"
          >
            <ContestInfo
              contest={contest}
              onContestUpdated={handleContestDataRefresh}
            />
          </div>
        )}

        {activeTab === "Problems" && (
          <div
            role="tabpanel"
            id="tabpanel-problems"
            aria-labelledby="tab-problems"
          >
            <ProblemList
              problems={contest.problems || []}
              contestId={contestId}
              onProblemsShouldRefresh={handleContestDataRefresh}
            />
          </div>
        )}

        {activeTab === "Registrations" && (
          <div
            role="tabpanel"
            id="tabpanel-registrations"
            aria-labelledby="tab-registrations"
          >
            <RegistrationTable contestId={contestId} />
          </div>
        )}

        {activeTab === "Leaderboard" && (
          <div
            role="tabpanel"
            id="tabpanel-leaderboard"
            aria-labelledby="tab-leaderboard"
          >
            <OwnerLeaderboard contestId={contestId} />
          </div>
        )}

        {activeTab === "Submissions" && (
          <div
            role="tabpanel"
            id="tabpanel-submissions"
            aria-labelledby="tab-submissions"
          >
            <OwnerSubmissionsList contestId={contestId} />
          </div>
        )}

        {activeTab === "Analytics" && (
          <div
            role="tabpanel"
            id="tabpanel-analytics"
            aria-labelledby="tab-analytics"
          >
            <ContestAnalyticsTab contestId={contestId} />
          </div>
        )}

        {activeTab === "Check Code" && (
          <div
            role="tabpanel"
            id="tabpanel-check-code"
            aria-labelledby="tab-check-code"
          >
            <ContestCheckCodeTab contestId={contestId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestDetailOwnerPage;
