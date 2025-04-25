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
import { format, parseISO } from "date-fns";
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
    title: contest.title,
    description: contest.description,
    start_time: contest.start_time,
    end_time: contest.end_time,
    isPublic: contest.isPublic,
    leaderboardStatus: contest.leaderboardStatus,
  });

  const [originalData, setOriginalData] = useState({ ...formData });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue;
    if (type === "checkbox") {
      finalValue = checked;
    } else if (type === "datetime-local") {
      finalValue = formatLocalInputStringToUtc(value);
    } else {
      finalValue = value;
    }
    if (finalValue !== null || type !== "datetime-local") {
      setFormData((prev) => ({ ...prev, [name]: finalValue }));
    } else {
      console.warn(`Invalid date/time entered for ${name}: ${value}`);
    }
  };

  const handleSubmit = async () => {
    if (!formData.start_time || !formData.end_time) {
      showToast("Start time and end time cannot be empty.", "error");
      return;
    }
    if (new Date(formData.end_time) <= new Date(formData.start_time)) {
      showToast("End time must be after start time.", "error");
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/contest/${contest._id}`, formData);
      showToast("Contest info updated successfully", "success");
      setOriginalData({ ...formData });
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
      setLoading(false);
    }
  };

  const cancelDeletion = () => {
    setShowConfirmModal(false);
  };

  const statusColor =
    contest.status === "upcoming"
      ? "text-green-500"
      : contest.status === "ongoing"
      ? "text-purple-500"
      : "text-gray-500";

  const leaderboardColor =
    formData.leaderboardStatus === "open" ? "text-blue-500" : "text-gray-500";

  return (
    <div>
      <div className="flex justify-between items-center">
        {editing ? (
          <input
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            disabled={loading}
            className="text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-b focus:outline-none flex-grow mr-4"
          />
        ) : (
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mr-4">
            {formData.title}
          </h1>
        )}

        <div className="flex items-center gap-3 flex-shrink-0">
          {editing ? (
            <button
              onClick={handleCancel}
              disabled={loading}
              className="text-sm text-gray-600 hover:underline flex items-center gap-1 disabled:opacity-50"
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
                {!loading && "Delete"}
              </button>
              <button
                onClick={() => setEditing(true)}
                disabled={loading}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1 disabled:opacity-50"
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
          className="mt-2 w-full bg-transparent text-gray-700 dark:text-gray-300 text-base border-b disabled:opacity-70"
        />
      ) : (
        <p className="text-gray-700 dark:text-gray-300 text-lg mt-2">
          {formData.description}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
        {["start_time", "end_time"].map((field) => (
          <div
            key={field}
            className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow flex items-start gap-3"
          >
            <FiClock
              className={
                field === "start_time" ? "text-blue-500" : "text-red-500"
              }
              size={20}
            />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-300 font-medium">
                {field === "start_time" ? "Start Time" : "End Time"}
              </p>
              {editing ? (
                <input
                  type="datetime-local"
                  name={field}
                  value={formatUtcToLocalInputString(formData[field])}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="mt-1 text-base bg-transparent dark:bg-gray-800 text-gray-900 dark:text-white border-b focus:outline-none disabled:opacity-70"
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

      <div className="flex flex-wrap justify-between items-center text-sm mt-6">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <FiUser className="text-purple-500" />
          <span className="font-medium">
            Created by: {contest.owner?.username || "Unknown"}
          </span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 ml-auto text-gray-600 dark:text-gray-300 flex-wrap">
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <FiGlobe className="text-green-500" />
                <select
                  name="isPublic"
                  value={String(formData.isPublic)}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isPublic: e.target.value === "true",
                    }))
                  }
                  disabled={loading}
                  className="bg-transparent dark:bg-gray-800 border-b focus:outline-none disabled:opacity-70"
                >
                  <option value="true">Public</option>
                  <option value="false">Private</option>
                </select>
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
            className={`font-bold uppercase flex items-center gap-1 ${statusColor}`}
          >
            <span>{contest.status}</span>
          </div>

          <div
            className={`font-bold uppercase flex items-center gap-1 ${leaderboardColor}`}
          >
            <FiBarChart2 />
            {editing ? (
              <select
                name="leaderboardStatus"
                value={formData.leaderboardStatus}
                onChange={handleInputChange}
                disabled={loading}
                className="bg-transparent dark:bg-gray-800 border-b focus:outline-none disabled:opacity-70"
              >
                <option value="open">Open</option>
                <option value="locked">Locked</option>
              </select>
            ) : (
              <span>{formData.leaderboardStatus}</span>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow disabled:opacity-50 flex items-center gap-1"
          >
            {loading ? <FiLoader className="animate-spin" /> : null}
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 text-sm text-gray-600 dark:text-gray-300">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow flex items-start gap-3">
          <FiClock className="text-gray-500 mt-1" size={18} />
          <div>
            <p className="font-medium text-gray-500 dark:text-gray-300 mb-1">
              Created At
            </p>
            <p className="text-gray-900 dark:text-white">
              {contest.createdAt
                ? format(new Date(contest.createdAt), "dd/MM/yyyy HH:mm")
                : "N/A"}
            </p>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow flex items-start gap-3">
          <FiClock className="text-gray-400 mt-1" size={18} />
          <div>
            <p className="font-medium text-gray-500 dark:text-gray-300 mb-1">
              Last Updated
            </p>
            <p className="text-gray-900 dark:text-white">
              {contest.updatedAt
                ? format(new Date(contest.updatedAt), "dd/MM/yyyy HH:mm")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <ConfirmModal
          message={`Are you sure you want to delete the contest "${contest.title}"? This action cannot be undone.`}
          onConfirm={confirmDeletion}
          onCancel={cancelDeletion}
        />
      )}
    </div>
  );
};

export default ContestInfo;
