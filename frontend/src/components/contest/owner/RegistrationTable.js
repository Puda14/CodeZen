"use client";

import { useEffect, useState } from "react";
import api from "@/utils/coreApi";
import { useToast } from "@/context/ToastProvider";
import ConfirmModal from "@/components/common/ConfirmModal";
import AddParticipantsModal from "@/components/contest/owner/AddParticipantsModal";
import { FiUserPlus } from "react-icons/fi";

const ITEMS_PER_PAGE = 10;

const RegistrationTable = ({ contestId }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState(null);
  const [confirmData, setConfirmData] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);

  const sortedRegistrations = [...registrations].sort((a, b) => {
    const { key, direction } = sortConfig;
    if (!key) return 0;

    const aVal = key === "status" ? a.status : a.user[key];
    const bVal = key === "status" ? b.status : b.user[key];

    return direction === "asc"
      ? aVal.localeCompare(bVal)
      : bVal.localeCompare(aVal);
  });

  const paginatedRegistrations = sortedRegistrations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(registrations.length / ITEMS_PER_PAGE);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const fetchRegistrations = async () => {
    try {
      const res = await api.get(`/contest/${contestId}/registrations`);
      setRegistrations(res.data);
    } catch (err) {
      setError("Failed to load registrations.");
      showToast("Failed to load registrations", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (userId, username, newStatus) => {
    setConfirmData({ userId, username, newStatus });
  };

  const handleConfirm = async () => {
    const { userId, newStatus } = confirmData;
    try {
      setUpdating(userId);
      const res = await api.post(
        `/contest/${contestId}/registration/${userId}`,
        { status: newStatus }
      );
      showToast(res.data.message, "success");
      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.user._id === userId ? { ...reg, status: newStatus } : reg
        )
      );
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to update status",
        "error"
      );
    } finally {
      setUpdating(null);
      setConfirmData(null);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [contestId]);

  if (loading) return <p>Loading registrations...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          Registrations ({registrations.length})
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <FiUserPlus />
          Add Participants
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border rounded overflow-hidden">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            <tr>
              <th
                className="px-4 py-2 border-b cursor-pointer select-none"
                onClick={() => handleSort("username")}
              >
                Username{" "}
                {sortConfig.key === "username" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="px-4 py-2 border-b cursor-pointer select-none"
                onClick={() => handleSort("email")}
              >
                Email{" "}
                {sortConfig.key === "email" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="px-4 py-2 border-b cursor-pointer select-none"
                onClick={() => handleSort("status")}
              >
                Status{" "}
                {sortConfig.key === "status" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th className="px-4 py-2 border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRegistrations.map((reg) => {
              const current = reg.status;
              let options = [];

              if (current === "pending") {
                options = ["approved", "rejected"];
              } else if (current === "approved") {
                options = ["rejected"];
              }

              return (
                <tr key={reg._id} className="border-b">
                  <td className="px-4 py-2">{reg.user.username}</td>
                  <td className="px-4 py-2">{reg.user.email}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`capitalize font-semibold px-2 py-1 rounded text-xs
                        ${
                          current === "approved"
                            ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200"
                            : current === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200"
                            : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200"
                        }
                      `}
                    >
                      {current}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {options.length > 0 ? (
                      <select
                        disabled={updating === reg.user._id}
                        defaultValue=""
                        onChange={(e) =>
                          handleStatusChange(
                            reg.user._id,
                            reg.user.username,
                            e.target.value
                          )
                        }
                        className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                      >
                        <option disabled value="">
                          Change to...
                        </option>
                        {options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-400 italic">No action</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded border text-sm font-medium
                ${
                  currentPage === i + 1
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                }
              `}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {confirmData && (
        <ConfirmModal
          message={`Are you sure you want to change ${confirmData.username}'s status to "${confirmData.newStatus}"?`}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmData(null)}
        />
      )}

      {showAddModal && (
        <AddParticipantsModal
          contestId={contestId}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchRegistrations}
        />
      )}
    </div>
  );
};

export default RegistrationTable;
