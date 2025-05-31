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
  FiAlertTriangle,
} from "react-icons/fi";
import { format } from "date-fns";
import api from "@/utils/coreApi";
import { useToast } from "@/context/ToastProvider";
import ConfirmModal from "@/components/common/ConfirmModal";

const formatUtcToLocalInputString = (isoUtcString) => {
  if (!isoUtcString) return "";
  try {
    const date = new Date(isoUtcString);
    if (isNaN(date.getTime())) {
      return "";
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
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
    return null;
  }
};

const ContestInfo = ({ contest, onContestUpdated }) => {
  const { showToast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: null,
    end_time: null,
    isPublic: true,
    leaderboardStatus: "closed",
  });

  const [originalData, setOriginalData] = useState({ ...formData });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (contest) {
      const initialFormData = {
        title: contest.title || "",
        description: contest.description || "",
        start_time: contest.start_time || null,
        end_time: contest.end_time || null,
        isPublic: contest.isPublic ?? true,
        leaderboardStatus: contest.leaderboardStatus || "closed",
      };
      setFormData(initialFormData);
      setOriginalData(initialFormData);
    }
  }, [contest]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "leaderboardStatus") return;

    let finalValue;
    if (type === "checkbox") {
      finalValue = checked;
    } else if (type === "datetime-local") {
      finalValue = formatLocalInputStringToUtc(value);
      if (finalValue === null && value !== "") {
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
    if (!formData.title || formData.title.trim() === "") {
      showToast("Contest title cannot be empty.", "error");
      return;
    }
    if (!formData.start_time || !formData.end_time) {
      showToast("Start time and end time cannot be empty.", "error");
      return;
    }
    const startDate = new Date(formData.start_time);
    const endDate = new Date(formData.end_time);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      showToast("Invalid start or end date format.", "error");
      return;
    }
    if (endDate <= startDate) {
      showToast("End time must be after start time.", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        start_time: formData.start_time,
        end_time: formData.end_time,
        isPublic: formData.isPublic,
      };

      await api.patch(`/contest/${contest._id}`, payload);
      showToast("Contest info updated successfully", "success");

      if (onContestUpdated) {
        onContestUpdated();
      }
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
      router.push("/contests");
      router.refresh();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete contest";
      showToast(msg, "error");
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

  const leaderboardColor =
    formData.leaderboardStatus === "open"
      ? "text-blue-500"
      : formData.leaderboardStatus === "frozen"
      ? "text-indigo-500"
      : "text-gray-500";

  return (
    <div className="p-4 md:p-6 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700 shadow-md">
      <div className="flex justify-between items-start mb-4">
        {editing ? (
          <input
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            disabled={loading}
            className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 flex-grow mr-4 py-1"
            placeholder="Contest Title"
          />
        ) : (
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mr-4 break-words">
            {formData.title}
          </h1>
        )}

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 mt-1">
          {editing ? (
            <button
              onClick={handleCancel}
              disabled={loading}
              className="text-sm text-gray-600 dark:text-gray-400 hover:underline disabled:opacity-50 px-3 py-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          ) : (
            <>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1.5 disabled:opacity-50 px-3 py-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-700/30"
                title="Delete Contest"
              >
                <FiTrash2 />
                <span className="hidden sm:inline">Delete</span>
              </button>
              <button
                onClick={() => setEditing(true)}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1.5 disabled:opacity-50 bg-blue-100 dark:bg-blue-700/30 hover:bg-blue-200 dark:hover:bg-blue-700/50 px-3 py-1.5 rounded-md"
              >
                <FiEdit3 />
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      <div className="text-gray-700 dark:text-gray-300 text-base mt-2 mb-6 prose dark:prose-invert max-w-none">
        {formData.description ? (
          <div
            dangerouslySetInnerHTML={{
              __html: formData.description.replace(/\n/g, "<br />"),
            }}
          />
        ) : (
          <span className="italic text-gray-500">No description provided.</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-6">
        {["start_time", "end_time"].map((field) => (
          <div key={field} className="flex items-start gap-3">
            <FiClock
              className={`mt-1 ${
                field === "start_time" ? "text-blue-500" : "text-red-500"
              }`}
              size={18}
            />
            <div>
              <label
                htmlFor={field}
                className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 block"
              >
                {field === "start_time" ? "Start Time" : "End Time"}
              </label>
              {editing ? (
                <input
                  type="datetime-local"
                  id={field}
                  name={field}
                  value={formatUtcToLocalInputString(formData[field])}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="text-sm bg-transparent dark:bg-gray-700 text-gray-900 dark:text-white border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-70 py-1 w-full"
                />
              ) : (
                <p className="text-sm text-gray-900 dark:text-white font-semibold">
                  {formData[field]
                    ? format(new Date(formData[field]), "MMM dd, yyyy HH:mm")
                    : "N/A"}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-between items-center text-xs sm:text-sm mt-6 gap-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <FiUser className="text-purple-500" />
          <span className="font-medium">
            Created by: {contest?.owner?.username || "Unknown"}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-gray-600 dark:text-gray-300 flex-wrap">
          <div className="flex items-center gap-1.5 p-1.5 bg-gray-100 dark:bg-gray-700 rounded">
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
                  className="text-xs bg-transparent dark:bg-gray-800 border-none focus:outline-none focus:ring-0 disabled:opacity-70 py-0.5 rounded"
                >
                  <option value="true">Public</option>
                  <option value="false">Private</option>
                </select>
                {formData.isPublic ? (
                  <FiGlobe className="text-green-500" />
                ) : (
                  <FiLock className="text-red-500" />
                )}
              </>
            ) : formData.isPublic ? (
              <>
                <FiGlobe className="text-green-500" />{" "}
                <span className="font-medium">Public</span>
              </>
            ) : (
              <>
                <FiLock className="text-red-500" />{" "}
                <span className="font-medium">Private</span>
              </>
            )}
          </div>

          <div
            className={`font-semibold uppercase flex items-center gap-1 p-1.5 bg-gray-100 dark:bg-gray-700 rounded ${statusColor}`}
          >
            <span>{contest?.status || "UNKNOWN"}</span>
          </div>

          <div
            className={`font-semibold uppercase flex items-center gap-1 p-1.5 bg-gray-100 dark:bg-gray-700 rounded ${leaderboardColor}`}
          >
            <FiBarChart2 />
            <span>{formData.leaderboardStatus || "UNKNOWN"}</span>
          </div>
        </div>
      </div>

      {editing && (
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800 focus:ring-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading && <FiLoader className="animate-spin h-4 w-4" />}
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-8 text-xs text-gray-600 dark:text-gray-300 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <FiClock
            className="text-gray-400 dark:text-gray-500 mt-0.5"
            size={16}
          />
          <div>
            <p className="font-medium text-gray-500 dark:text-gray-400 mb-0.5">
              Created At
            </p>
            <p className="text-gray-900 dark:text-white">
              {contest?.createdAt
                ? format(new Date(contest.createdAt), "MMM dd, yyyy HH:mm")
                : "N/A"}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <FiClock
            className="text-gray-400 dark:text-gray-500 mt-0.5"
            size={16}
          />
          <div>
            <p className="font-medium text-gray-500 dark:text-gray-400 mb-0.5">
              Last Updated
            </p>
            <p className="text-gray-900 dark:text-white">
              {contest?.updatedAt
                ? format(new Date(contest.updatedAt), "MMM dd, yyyy HH:mm")
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
          isLoading={loading}
        />
      )}
    </div>
  );
};

export default ContestInfo;
