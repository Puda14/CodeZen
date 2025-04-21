"use client";

import { useEffect, useState } from "react";
import ContestItem from "@/components/contest/ContestItem";
import api from "@/utils/coreApi";
import { useToast } from "@/context/ToastProvider";
import { getUserIdFromToken } from "@/utils/auth/getUserIdFromToken";
import { FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";

const TABS = ["Public", "Registered", "Owned"];
const ITEMS_PER_PAGE = 10;

const ContestsPage = () => {
  const [activeTab, setActiveTab] = useState("Public");
  const [contests, setContests] = useState([]);
  const [filteredContests, setFilteredContests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { showToast } = useToast();
  const [errorMessage, setErrorMessage] = useState("");

  const fetchContests = async () => {
    setLoading(true);
    try {
      let data = [];

      if (activeTab === "Public") {
        const [upcomingRes, ongoingRes] = await Promise.all([
          api.get("/contest/status/upcoming"),
          api.get("/contest/status/ongoing"),
        ]);

        const upcoming = upcomingRes.data || [];
        const ongoing = ongoingRes.data || [];

        data = [...ongoing, ...upcoming];
      } else {
        const userId = getUserIdFromToken();

        if (!userId) {
          setErrorMessage("You need to log in to view this tab.");
          showToast("Please login to continue", "error");
          setContests([]);
          setFilteredContests([]);
          return;
        }

        if (activeTab === "Registered") {
          const res = await api.get("/contest/registered");
          data = res.data || [];
        } else if (activeTab === "Owned") {
          const res = await api.get("/contest/owned");
          data = res.data || [];
        }
      }

      setContests(data);
      setFilteredContests(data);
      setPage(1);
    } catch (err) {
      console.error("Failed to fetch contests:", err);

      setContests([]);
      setFilteredContests([]);

      const status = err.response?.status;
      const message =
        err.response?.data?.message ||
        "Failed to fetch contests. Please try again.";

      if (status === 401 || status === 403) {
        setErrorMessage("You need to log in to view this tab.");
        showToast("Please login to continue", "error");
      } else {
        setErrorMessage(message);
        showToast(message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
    setSearchTerm("");
  }, [activeTab]);

  useEffect(() => {
    const filtered = contests.filter((c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContests(filtered);
    setPage(1);
  }, [searchTerm, contests]);

  const totalPages = Math.ceil(filteredContests.length / ITEMS_PER_PAGE);
  const paginatedContests = filteredContests.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const handlePrev = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">
        Contests
      </h1>

      <div className="max-w-3xl mx-auto">
        {/* Tabs */}
        <ul className="flex flex-wrap text-sm font-medium text-gray-500 border-b border-gray-300 dark:border-gray-700 dark:text-gray-400 mb-4">
          {TABS.map((tab) => (
            <li key={tab} className="me-2">
              <button
                onClick={() => setActiveTab(tab)}
                className={`inline-block px-4 py-2 rounded-t-lg transition-all duration-200 ${
                  activeTab === tab
                    ? "text-blue-600 bg-gray-100 dark:bg-gray-800 dark:text-blue-500 border-b-2 border-blue-600"
                    : "hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                }`}
              >
                {tab}
              </button>
            </li>
          ))}
        </ul>

        {/* Search bar */}
        <div className="relative mb-6">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Search contests by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Contest List */}
      {loading ? (
        <p className="text-center text-gray-600 dark:text-gray-300">
          Loading...
        </p>
      ) : paginatedContests.length > 0 ? (
        <>
          <div className="space-y-4 max-w-3xl mx-auto">
            {paginatedContests.map((contest) => (
              <ContestItem key={contest._id} contest={contest} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center mt-6 space-x-4">
            <button
              onClick={handlePrev}
              disabled={page === 1}
              className={`p-2 rounded-full ${
                page === 1
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <FiChevronLeft size={20} />
            </button>

            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={handleNext}
              disabled={page === totalPages}
              className={`p-2 rounded-full ${
                page === totalPages
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-600 dark:text-gray-300">
          No contests found for this tab.
        </p>
      )}
    </div>
  );
};

export default ContestsPage;
