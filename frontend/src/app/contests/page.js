"use client";

import { useEffect, useState } from "react";
import ContestItem from "@/components/contest/ContestItem";
import api from "@/utils/coreApi";
import { useToast } from "@/context/ToastProvider";
import { getUserIdFromToken } from "@/utils/auth/getUserIdFromToken";
import {
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiPlus,
} from "react-icons/fi";
import Link from "next/link";

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchContests = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      let data = [];
      setContests([]);
      setFilteredContests([]);
      setPage(1);

      if (activeTab === "Public") {
        const [upcomingRes, ongoingRes] = await Promise.all([
          api.get("/contest/status/upcoming").catch((err) => {
            return { data: [] };
          }),
          api.get("/contest/status/ongoing").catch((err) => {
            return { data: [] };
          }),
        ]);

        const upcoming = Array.isArray(upcomingRes.data)
          ? upcomingRes.data
          : [];
        const ongoing = Array.isArray(ongoingRes.data) ? ongoingRes.data : [];
        data = [...ongoing, ...upcoming];
      } else {
        const userId = getUserIdFromToken();
        if (!userId && (activeTab === "Registered" || activeTab === "Owned")) {
          setErrorMessage("You need to log in to view this tab.");

          setLoading(false);
          return;
        }

        if (activeTab === "Registered") {
          const res = await api.get("/contest/registered");
          data = Array.isArray(res.data) ? res.data : [];
        } else if (activeTab === "Owned") {
          const res = await api.get("/contest/owned");
          data = Array.isArray(res.data) ? res.data : [];
        }
      }
      setContests(data);
    } catch (err) {
      const status = err.response?.status;
      const message =
        err.response?.data?.message ||
        "Failed to fetch contests. Please try again.";

      if (status === 401 || status === 403) {
        setErrorMessage("Login required or insufficient permissions.");
      } else {
        setErrorMessage(message);
      }
      setContests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
    setSearchTerm("");
  }, [activeTab]);

  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = contests.filter(
      (c) =>
        c.title?.toLowerCase().includes(lowerSearchTerm) ||
        c.description?.toLowerCase().includes(lowerSearchTerm)
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

      <div className="max-w-4xl mx-auto">
        <ul className="flex justify-between items-center flex-wrap text-sm font-medium text-gray-500 border-b border-gray-300 dark:border-gray-700 dark:text-gray-400 mb-4">
          <div className="flex flex-wrap">
            {TABS.map((tab) => (
              <li key={tab} className="me-2">
                <button
                  onClick={() => setActiveTab(tab)}
                  className={`inline-block px-4 py-2 rounded-t-lg transition-all duration-200 focus:outline-none ${
                    activeTab === tab
                      ? "text-blue-600 bg-gray-100 dark:bg-gray-800 dark:text-blue-500 border-b-2 border-blue-600 font-semibold"
                      : "border-b-2 border-transparent hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  }`}
                >
                  {tab}
                </button>
              </li>
            ))}
          </div>
          <li>
            <Link
              href="/contests/create"
              className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-medium px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <FiPlus size={16} /> Create
            </Link>
          </li>
        </ul>
        <div className="relative mb-6">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Search contests by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {loading ? (
          <p className="text-center text-gray-600 dark:text-gray-300 py-10">
            Loading...
          </p>
        ) : errorMessage ? (
          <p className="text-center text-red-600 dark:text-red-400 py-10">
            {errorMessage}
          </p>
        ) : paginatedContests.length > 0 ? (
          <>
            <div className="space-y-4">
              {paginatedContests.map((contest) => (
                <ContestItem key={contest._id} contest={contest} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 space-x-4">
                <button
                  onClick={handlePrev}
                  disabled={page === 1}
                  className={`p-2 rounded-full transition-colors ${
                    page === 1
                      ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                  aria-label="Previous page"
                >
                  <FiChevronLeft size={20} />
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={handleNext}
                  disabled={page === totalPages}
                  className={`p-2 rounded-full transition-colors ${
                    page === totalPages
                      ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                  aria-label="Next page"
                >
                  <FiChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-gray-600 dark:text-gray-300 py-10">
            No contests found{searchTerm ? " matching your search" : ""}
            {activeTab !== "Public" ? ` in ${activeTab} tab` : ""}.
          </p>
        )}
      </div>
    </div>
  );
};

export default ContestsPage;
