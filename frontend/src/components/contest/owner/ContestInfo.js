"use client";

import { useState } from "react";
import {
  FiClock,
  FiUser,
  FiLock,
  FiGlobe,
  FiBarChart2,
  FiEdit3,
} from "react-icons/fi";
import { format } from "date-fns";
import api from "@/utils/coreApi";
import { useToast } from "@/context/ToastProvider";

const ContestInfo = ({ contest }) => {
  const { showToast } = useToast();

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
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

  const formatTimeInput = (isoString) =>
    new Date(isoString).toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm

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
            className="text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-b focus:outline-none"
          />
        ) : (
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {formData.title}
          </h1>
        )}

        <button
          onClick={editing ? handleCancel : () => setEditing(true)}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <FiEdit3 />
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      {editing ? (
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
          className="mt-2 w-full bg-transparent text-gray-700 dark:text-gray-300 text-base border-b"
        />
      ) : (
        <p className="text-gray-700 dark:text-gray-300 text-lg mt-2">
          {formData.description}
        </p>
      )}

      {/* Time Info */}
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
                  value={formatTimeInput(formData[field])}
                  onChange={handleInputChange}
                  className="mt-1 text-base bg-transparent dark:bg-gray-800 text-gray-900 dark:text-white border-b focus:outline-none"
                />
              ) : (
                <p className="text-base text-gray-900 dark:text-white font-semibold">
                  {format(new Date(formData[field]), "dd/MM/yyyy HH:mm")}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap justify-between items-center text-sm mt-6">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <FiUser className="text-purple-500" />
          <span className="font-medium">
            Created by: {contest.owner.username}
          </span>
        </div>

        <div className="flex items-center gap-6 ml-auto text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <FiGlobe className="text-green-500" />
                <select
                  name="isPublic"
                  value={formData.isPublic ? "true" : "false"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isPublic: e.target.value === "true",
                    }))
                  }
                  className="bg-transparent dark:bg-gray-800 border-b focus:outline-none"
                >
                  <option value="true">Public</option>
                  <option value="false">Private</option>
                </select>
              </>
            ) : formData.isPublic ? (
              <>
                <FiGlobe className="text-green-500" />
                <span className="font-medium">Public</span>
              </>
            ) : (
              <>
                <FiLock className="text-red-500" />
                <span className="font-medium">Private</span>
              </>
            )}
          </div>

          <div
            className={`font-bold uppercase flex items-center gap-1 ${statusColor}`}
          >
            <span>Status:</span> <span>{contest.status}</span>
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
                className="bg-transparent dark:bg-gray-800 border-b focus:outline-none"
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

      {/* Save Button */}
      {editing && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 text-sm text-gray-600 dark:text-gray-300">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow flex items-start gap-3">
          <FiClock className="text-gray-500 mt-1" size={18} />
          <div>
            <p className="font-medium text-gray-500 dark:text-gray-300 mb-1">
              Created At
            </p>
            <p className="text-gray-900 dark:text-white">
              {format(new Date(contest.createdAt), "dd/MM/yyyy HH:mm")}
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
              {format(new Date(contest.updatedAt), "dd/MM/yyyy HH:mm")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestInfo;
