"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { FiClock, FiUser, FiLock, FiGlobe, FiArrowLeft } from "react-icons/fi";
import { useToast } from "@/context/ToastProvider";
import api from "@/utils/coreApi";

const ContestDetail = ({ contest }) => {
  const router = useRouter();
  const { showToast } = useToast();

  const [registrationStatus, setRegistrationStatus] =
    useState("not_registered");
  const [loadingStatus, setLoadingStatus] = useState(true);

  const fetchRegistrationStatus = async () => {
    try {
      const res = await api.get(`/contest/${contest._id}/registration-status`);
      setRegistrationStatus(res.data.status);
    } catch (err) {
      console.error("Failed to check registration status:", err);
      showToast("Could not load registration status.", "error");
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchRegistrationStatus();
  }, [contest._id]);

  const handleRegister = async () => {
    try {
      const res = await api.post(`/contest/${contest._id}/register`);
      showToast(res.data.message, "success");
      fetchRegistrationStatus();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to register";
      showToast(message, "error");
    }
  };

  const handleUnregister = async () => {
    try {
      const res = await api.delete(`/contest/${contest._id}/register`);
      showToast(res.data.message || "Unregistered successfully", "success");
      fetchRegistrationStatus();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to unregister";
      showToast(message, "error");
    }
  };

  const isPublic = contest.isPublic;
  const statusColor =
    contest.status === "upcoming"
      ? "text-green-500"
      : contest.status === "ongoing"
      ? "text-purple-500"
      : "text-gray-500";

  const renderButton = () => {
    if (loadingStatus) return null;

    let label = "Register";
    let action = handleRegister;
    let buttonColor = "bg-gradient-to-r from-blue-500 to-indigo-600";

    if (registrationStatus === "pending") {
      label = "Pending Approval";
      action = null;
      buttonColor = "bg-yellow-400 cursor-not-allowed";
    } else if (registrationStatus === "approved") {
      label = "Unregister";
      action = handleUnregister;
      buttonColor = "bg-red-500 hover:bg-red-600";
    } else if (registrationStatus === "rejected") {
      label = "Registration Rejected";
      action = null;
      buttonColor = "bg-gray-400 cursor-not-allowed";
    }

    return (
      <motion.button
        onClick={action}
        whileHover={{ scale: action ? 1.05 : 1 }}
        whileTap={{ scale: action ? 0.97 : 1 }}
        disabled={!action}
        className={`mt-6 px-6 py-2 rounded-lg text-white font-semibold shadow-md transition duration-300 ease-in-out ${buttonColor}`}
      >
        {label}
      </motion.button>
    );
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-6 mt-8 relative">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition mb-4"
        title="Go back"
      >
        <FiArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </button>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        {contest.title}
      </h1>

      <p className="text-gray-700 dark:text-gray-300 text-lg">
        {contest.description}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex items-center gap-3 text-gray-700 dark:text-gray-300"
        >
          <FiClock className="text-blue-500" />
          <span>
            <strong>Start:</strong>{" "}
            {format(new Date(contest.start_time), "PPPpp")}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex items-center gap-3 text-gray-700 dark:text-gray-300"
        >
          <FiClock className="text-red-500" />
          <span>
            <strong>End:</strong> {format(new Date(contest.end_time), "PPPpp")}
          </span>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-300 text-sm mt-6"
      >
        <div className="flex items-center gap-2">
          <FiUser className="text-purple-500" />
          <span className="font-medium">
            Created by: {contest.owner.username}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isPublic ? (
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

        <div className={`font-bold uppercase ${statusColor}`}>
          Status: {contest.status}
        </div>
      </motion.div>

      {/* Register / Unregister Button */}
      <div className="flex justify-end">{renderButton()}</div>
    </div>
  );
};

export default ContestDetail;
