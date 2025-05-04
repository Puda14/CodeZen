"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiInfo,
  FiLoader,
  FiList,
  FiUsers,
  FiBarChart2,
  FiSettings,
} from "react-icons/fi";
import api from "@/utils/coreApi";
import ContestInfo from "@/components/contest/owner/ContestInfo";
import RegistrationTable from "@/components/contest/owner/RegistrationTable";
import ProblemList from "@/components/contest/owner/ProblemList";
import OwnerLeaderboard from "@/components/contest/owner/OwnerLeaderboard";

const TABS = [
  { name: "Settings", icon: FiSettings },
  { name: "Problems", icon: FiList },
  { name: "Registrations", icon: FiUsers },
  { name: "Leaderboard", icon: FiBarChart2 },
];

const ContestDetailOwnerPage = () => {
  const { id: contestId } = useParams();
  const router = useRouter();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(TABS[0].name);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get(`/contest/${contestId}/owner`);
      setContest(res.data);
    } catch (err) {
      console.error("Failed to fetch contest owner data:", err);

      if (err.response?.status === 404 || err.response?.status === 403) {
        setError("Contest not found or access denied.");
      } else {
        setError("Failed to load contest data.");
      }
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    if (contestId) {
      setLoading(true);
      fetchData();
    } else {
      setError("Contest ID is missing from URL.");
      setLoading(false);
    }
  }, [contestId, fetchData]);

  const handleDataRefreshNeeded = useCallback(() => {
    console.log("Refreshing contest data...");
    fetchData();
  }, [fetchData]);

  const [error, setError] = useState(null);
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-var(--header-height,8rem))]">
        <FiLoader className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,8rem))] text-red-500 px-4">
        <FiAlertTriangle className="text-5xl mb-3" />
        <p className="text-center">{error}</p>
        <button
          onClick={() => router.push("/contests/owned")}
          className="mt-5 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Owned Contests
        </button>
      </div>
    );
  }

  if (!contest)
    return <p className="text-center mt-10">Contest data unavailable.</p>;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 max-w-7xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition"
          title="Go back"
        >
          <FiArrowLeft size={18} />
          <span>Back</span>
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 text-center flex-grow">
          {contest.title} - Owner Panel
        </h1>
        <div className="w-16"></div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-300 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
          {TABS.map((tab) => (
            <li key={tab.name} className="me-2">
              <button
                onClick={() => setActiveTab(tab.name)}
                className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group ${
                  activeTab === tab.name
                    ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500 active font-semibold"
                    : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-600"
                }`}
                aria-current={activeTab === tab.name ? "page" : undefined}
              >
                <tab.icon className="me-2 w-4 h-4" /> {tab.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "Settings" && <ContestInfo contest={contest} />}

        {activeTab === "Problems" && (
          <ProblemList
            problems={contest.problems || []}
            contestId={contestId}
            onProblemsShouldRefresh={handleDataRefreshNeeded}
          />
        )}

        {activeTab === "Registrations" && (
          <RegistrationTable contestId={contestId} />
        )}

        {activeTab === "Leaderboard" && (
          <OwnerLeaderboard contestId={contestId} />
        )}
      </div>
    </div>
  );
};

export default ContestDetailOwnerPage;
