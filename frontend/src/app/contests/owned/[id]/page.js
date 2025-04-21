"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import api from "@/utils/coreApi";
import ContestInfo from "@/components/contest/owner/ContestInfo";
import RegistrationTable from "@/components/contest/owner/RegistrationTable";
import ProblemList from "@/components/contest/owner/ProblemList";

const ContestDetailOwnerPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/contest/${id}/owner`);
      setContest(res.data);
    } catch (err) {
      console.error("Failed to fetch contest owner data:", err);
      router.push("/contests/owned");
    } finally {
      setLoading(false);
    }
  }, [id, router]);
  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, fetchData]);

  const handleDataRefreshNeeded = () => {
    console.log("Refreshing contest data...");
    fetchData();
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!contest)
    return (
      <p className="text-center mt-10">Contest not found or access denied.</p>
    );

  return (
    <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-8 mt-8 relative">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition mb-4"
        title="Go back"
      >
        <FiArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Contest Info */}
      <ContestInfo contest={contest} />

      {/* Registrations List */}
      <RegistrationTable contestId={id} />

      {/* Problems List */}
      <ProblemList
        problems={contest.problems}
        onProblemsShouldRefresh={handleDataRefreshNeeded}
        onTestcaseUpdate={handleDataRefreshNeeded}
      />
    </div>
  );
};

export default ContestDetailOwnerPage;
