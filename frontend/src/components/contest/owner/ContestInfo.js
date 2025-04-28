"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiClock,
  FiUser,
  FiLock,
  FiGlobe,
  FiBarChart2,
  FiEdit3,
  FiTrash2,
  FiLoader,
} from "react-icons/fi";
import { format } from "date-fns";
import api from "@/utils/coreApi";
import { useToast } from "@/context/ToastProvider";
import ConfirmModal from "@/components/common/ConfirmModal";

const formatUtcToLocalInputString = (isoUtcString) => {
  if (!isoUtcString) return "";
  try {
    const date = new Date(isoUtcString);
    if (isNaN(date.getTime())) throw new Error("Invalid date");
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error(
      "Error formatting UTC to Local Input String:",
      error,
      "Input:",
      isoUtcString
    );
    return "";
  }
};

const formatLocalInputStringToUtc = (localDateTimeString) => {
  if (!localDateTimeString) return null;
  try {
    const date = new Date(localDateTimeString);
    if (isNaN(date.getTime())) throw new Error("Invalid date");
    return date.toISOString();
  } catch (error) {
    console.error(
      "Error formatting Local Input String to UTC:",
      error,
      "Input:",
      localDateTimeString
    );
    return null;
  }
};

const ContestInfo = ({ contest }) => {
  const { showToast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: contest.title || "",
    description: contest.description || "",
    start_time: contest.start_time || null,
    end_time: contest.end_time || null,
    isPublic: contest.isPublic ?? true,
    leaderboardStatus: contest.leaderboardStatus || "closed",
  });

  useEffect(() => {
    setFormData({
      title: contest.title || "",
      description: contest.description || "",
      start_time: contest.start_time || null,
      end_time: contest.end_time || null,
      isPublic: contest.isPublic ?? true,
      leaderboardStatus: contest.leaderboardStatus || "closed",
    });
    setOriginalData({
      title: contest.title || "",
      description: contest.description || "",
      start_time: contest.start_time || null,
      end_time: contest.end_time || null,
      isPublic: contest.isPublic ?? true,
      leaderboardStatus: contest.leaderboardStatus || "closed",
    });
  }, [contest]);

  const [originalData, setOriginalData] = useState({ ...formData });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "leaderboardStatus") return;

    let finalValue;
    if (type === "checkbox") {
      finalValue = checked;
    } else if (type === "datetime-local") {
      finalValue = formatLocalInputStringToUtc(value);
      if (finalValue === null) {
        showToast(
          `Invalid date/time format for ${name.replace("_", " ")}.`,
          "warning"
        );
        return;
      }
    } else {
      finalValue = value;
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async () => {
    if (!formData.start_time || !formData.end_time) {
      showToast("Start time and end time cannot be empty.", "error");
      return;
    }
    const startDate = new Date(formData.start_time);
    const endDate = new Date(formData.end_time);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      showToast("Invalid start or end date.", "error");
      return;
    }
    if (endDate <= startDate) {
      showToast("End time must be after start time.", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = { ...formData };
      // *** Remove leaderboardStatus from the payload before sending ***
      delete payload.leaderboardStatus;

      await api.patch(`/contest/${contest._id}`, payload);
      showToast("Contest info updated successfully", "success");

      // Fetch the latest contest data after successful update to get the real leaderboardStatus
      const updatedContestRes = await api.get(`/contest/${contest._id}/owner`);
      const updatedContestData = updatedContestRes.data;

      // Update both formData and originalData with fresh data from server
      const freshData = {
        title: updatedContestData.title || "",
        description: updatedContestData.description || "",
        start_time: updatedContestData.start_time || null,
        end_time: updatedContestData.end_time || null,
        isPublic: updatedContestData.isPublic ?? true,
        leaderboardStatus: updatedContestData.leaderboardStatus || "closed", // Use updated status
      };
      setFormData(freshData);
      setOriginalData(freshData);

      setEditing(false);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update contest info";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...originalData });
    setEditing(false);
  };

  const handleDelete = () => {
    setShowConfirmModal(true);
  };

  const confirmDeletion = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      await api.delete(`/contest/${contest._id}`);
      showToast("Contest deleted successfully", "success");
      router.push("/contests/owned");
      router.refresh();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete contest";
      showToast(msg, "error");
      setLoading(false);
    }
  };

  const cancelDeletion = () => {
    setShowConfirmModal(false);
  };

  const statusColor =
    contest?.status === "upcoming"
      ? "text-green-500"
      : contest?.status === "ongoing"
      ? "text-purple-500"
      : "text-gray-500";

  // Use formData.leaderboardStatus for display color consistency
  const leaderboardColor =
    formData.leaderboardStatus === "open"
      ? "text-blue-500"
      : formData.leaderboardStatus === "frozen"
      ? "text-indigo-500"
      : "text-gray-500";

  return (
    <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        {editing ? (
          <input
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            disabled={loading}
            className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 flex-grow mr-4"
          />
        ) : (
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mr-4">
            {formData.title}
          </h1>
        )}

        <div className="flex items-center gap-3 flex-shrink-0">
          {editing ? (
            <button
              onClick={handleCancel}
              disabled={loading}
              className="text-sm text-gray-600 dark:text-gray-400 hover:underline disabled:opacity-50"
            >
              Cancel
            </button>
          ) : (
            <>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="text-sm text-red-600 hover:text-red-800 hover:underline flex items-center gap-1 disabled:opacity-50"
                title="Delete Contest"
              >
                <FiTrash2 />
                <span className="hidden sm:inline">Delete</span>
              </button>
              <button
                onClick={() => setEditing(true)}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <FiEdit3 />
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
          disabled={loading}
          className="mt-2 w-full bg-transparent text-gray-700 dark:text-gray-300 text-base border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-70"
        />
      ) : (
        <p className="text-gray-700 dark:text-gray-300 text-lg mt-2 mb-4">
          {formData.description || (
            <span className="italic text-gray-500">
              No description provided.
            </span>
          )}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
        {["start_time", "end_time"].map((field) => (
          <div
            key={field}
            className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow flex items-start gap-3 border border-gray-200 dark:border-gray-600"
          >
            <FiClock
              className={
                field === "start_time" ? "text-blue-500" : "text-red-500"
              }
              size={20}
            />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
                {field === "start_time" ? "Start Time" : "End Time"}
              </p>
              {editing ? (
                <input
                  type="datetime-local"
                  name={field}
                  value={formatUtcToLocalInputString(formData[field])}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="mt-1 text-base bg-transparent dark:bg-gray-800 text-gray-900 dark:text-white border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-70"
                />
              ) : (
                <p className="text-base text-gray-900 dark:text-white font-semibold">
                  {formData[field]
                    ? format(new Date(formData[field]), "dd/MM/yyyy HH:mm")
                    : "N/A"}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-between items-center text-sm mt-6 gap-y-3">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <FiUser className="text-purple-500" />
          <span className="font-medium">
            Created by: {contest?.owner?.username || "Unknown"}
          </span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 ml-auto text-gray-600 dark:text-gray-300 flex-wrap">
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <label htmlFor="isPublic" className="sr-only">
                  Visibility
                </label>
                <select
                  id="isPublic"
                  name="isPublic"
                  value={String(formData.isPublic)}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isPublic: e.target.value === "true",
                    }))
                  }
                  disabled={loading}
                  className="text-sm bg-transparent dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-70 py-0.5"
                >
                  <option value="true">Public</option>
                  <option value="false">Private</option>
                </select>
                {formData.isPublic ? (
                  <FiGlobe className="text-green-500 ml-1" />
                ) : (
                  <FiLock className="text-red-500 ml-1" />
                )}
              </>
            ) : formData.isPublic ? (
              <>
                {" "}
                <FiGlobe className="text-green-500" />{" "}
                <span className="font-medium">Public</span>{" "}
              </>
            ) : (
              <>
                {" "}
                <FiLock className="text-red-500" />{" "}
                <span className="font-medium">Private</span>{" "}
              </>
            )}
          </div>

          <div
            className={`font-semibold uppercase flex items-center gap-1 ${statusColor}`}
          >
            <span>{contest?.status || "UNKNOWN"}</span>
          </div>

          <div
            className={`font-semibold uppercase flex items-center gap-1 ${leaderboardColor}`}
          >
            <FiBarChart2 />
            <span>{formData.leaderboardStatus || "UNKNOWN"}</span>
          </div>
        </div>
      </div>

      {editing && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? <FiLoader className="animate-spin h-4 w-4" /> : null}
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 text-sm text-gray-600 dark:text-gray-300">
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow flex items-start gap-3 border border-gray-200 dark:border-gray-600">
          <FiClock
            className="text-gray-400 dark:text-gray-500 mt-0.5"
            size={18}
          />
          <div>
            <p className="font-medium text-gray-500 dark:text-gray-400 mb-1">
              Created At
            </p>
            <p className="text-gray-900 dark:text-white">
              {contest?.createdAt
                ? format(new Date(contest.createdAt), "dd/MM/yyyy HH:mm")
                : "N/A"}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow flex items-start gap-3 border border-gray-200 dark:border-gray-600">
          <FiClock
            className="text-gray-400 dark:text-gray-500 mt-0.5"
            size={18}
          />
          <div>
            <p className="font-medium text-gray-500 dark:text-gray-400 mb-1">
              Last Updated
            </p>
            <p className="text-gray-900 dark:text-white">
              {contest?.updatedAt
                ? format(new Date(contest.updatedAt), "dd/MM/yyyy HH:mm")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <ConfirmModal
          message={`Are you sure you want to delete the contest "${
            contest?.title || "this contest"
          }"? This action cannot be undone.`}
          onConfirm={confirmDeletion}
          onCancel={cancelDeletion}
        />
      )}
    </div>
  );
};

export default ContestInfo;
