"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  FiClock,
  FiUser,
  FiLock,
  FiGlobe,
  FiArrowLeft,
  FiPlayCircle,
  FiLoader,
} from "react-icons/fi";
import { useToast } from "@/context/ToastProvider";
import api from "@/utils/coreApi";

const isValidDate = (d) => d instanceof Date && !isNaN(d);

const ContestDetail = ({ contest }) => {
  const router = useRouter();
  const { showToast } = useToast();

  const [registrationStatus, setRegistrationStatus] =
    useState("not_registered");
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchRegistrationStatus = async () => {
    setLoadingStatus(true);
    try {
      const endTimeLocal = new Date(contest.end_time);
      const startTimeLocal = new Date(contest.start_time);
      const now = new Date();

      if (
        isValidDate(endTimeLocal) &&
        now < endTimeLocal &&
        (!isValidDate(startTimeLocal) || now < startTimeLocal)
      ) {
        const res = await api.get(
          `/contest/${contest._id}/registration-status`
        );
        setRegistrationStatus(res.data.status);
      }
    } catch (err) {
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (contest?._id) {
      fetchRegistrationStatus();
    }
  }, [contest?._id]);

  const handleRegister = async () => {
    setLoadingStatus(true);
    try {
      const res = await api.post(`/contest/${contest._id}/register`);
      showToast(res.data.message || "Registered successfully", "success");
      fetchRegistrationStatus();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to register";
      showToast(message, "error");
      setLoadingStatus(false);
    }
  };

  const handleUnregister = async () => {
    setLoadingStatus(true);
    try {
      const res = await api.delete(`/contest/${contest._id}/register`);
      showToast(res.data.message || "Unregistered successfully", "success");
      fetchRegistrationStatus();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to unregister";
      showToast(message, "error");
      setLoadingStatus(false);
    }
  };

  const renderButton = () => {
    const now = currentTime;
    const startTimeLocal = new Date(contest.start_time);
    const endTimeLocal = new Date(contest.end_time);

    if (!isValidDate(startTimeLocal) || !isValidDate(endTimeLocal)) {
      return (
        <p className="text-sm text-red-500 mt-6">
          Error: Invalid contest time data.
        </p>
      );
    }

    if (contest.status === "finished" || now >= endTimeLocal) {
      return null;
    }

    if (now >= startTimeLocal && now < endTimeLocal) {
      if (registrationStatus === "approved" || contest.isPublic) {
        return (
          <motion.button
            onClick={() => router.push(`/contests/${contest._id}/take`)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className={`mt-6 px-6 py-2 rounded-lg text-white font-semibold shadow-md transition duration-300 ease-in-out bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 flex items-center gap-2`}
          >
            <FiPlayCircle />
            Enter Contest
          </motion.button>
        );
      } else if (registrationStatus !== "not_registered") {
        return (
          <p className="mt-6 text-sm text-yellow-600 dark:text-yellow-400">
            Contest is ongoing. Your registration is {registrationStatus}.
          </p>
        );
      } else {
        return (
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Contest is ongoing. Registration is closed or required.
          </p>
        );
      }
    }

    if (loadingStatus) {
      return (
        <div className="mt-6 px-6 py-2 rounded-lg text-white font-semibold shadow-md bg-gray-400 flex justify-center items-center cursor-wait">
          <FiLoader className="animate-spin" />
        </div>
      );
    }

    let label = "Register";
    let action = handleRegister;
    let buttonColor =
      "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700";
    let isDisabled = false;

    if (registrationStatus === "pending") {
      label = "Pending Approval";
      action = null;
      buttonColor = "bg-yellow-500 cursor-not-allowed";
      isDisabled = true;
    } else if (registrationStatus === "approved") {
      label = "Unregister";
      action = handleUnregister;
      buttonColor = "bg-red-500 hover:bg-red-600";
    } else if (registrationStatus === "rejected") {
      label = "Registration Rejected";
      action = null;
      buttonColor = "bg-gray-500 cursor-not-allowed";
      isDisabled = true;
    } else if (registrationStatus === "not_registered" && !contest.isPublic) {
      label = "Register (Private)";
      action = handleRegister;
    } else if (registrationStatus === "not_registered" && contest.isPublic) {
      label = "Register (Public)";
      action = handleRegister;
    }

    return (
      <motion.button
        onClick={action}
        whileHover={{ scale: !isDisabled ? 1.05 : 1 }}
        whileTap={{ scale: !isDisabled ? 0.97 : 1 }}
        disabled={isDisabled}
        className={`mt-6 px-6 py-2 rounded-lg text-white font-semibold shadow-md transition duration-300 ease-in-out ${buttonColor} ${
          isDisabled ? "opacity-70" : ""
        }`}
      >
        {label}
      </motion.button>
    );
  };

  const isPublic = contest?.isPublic;
  const statusColor =
    contest?.status === "upcoming"
      ? "text-green-500"
      : contest?.status === "ongoing"
      ? "text-purple-500"
      : "text-gray-500";

  if (!contest) {
    return null;
  }

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
        {contest.title || "Contest Title"}
      </h1>

      <p className="text-gray-700 dark:text-gray-300 text-lg">
        {contest.description || "No description available."}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow flex items-start gap-3"
        >
          <FiClock className="text-blue-500 mt-1" size={20} />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-300 font-medium">
              Start Time
            </p>
            <p className="text-base text-gray-900 dark:text-white font-semibold">
              {contest.start_time && isValidDate(new Date(contest.start_time))
                ? format(new Date(contest.start_time), "dd/MM/yyyy HH:mm")
                : "N/A"}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow flex items-start gap-3"
        >
          <FiClock className="text-red-500 mt-1" size={20} />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-300 font-medium">
              End Time
            </p>
            <p className="text-base text-gray-900 dark:text-white font-semibold">
              {contest.end_time && isValidDate(new Date(contest.end_time))
                ? format(new Date(contest.end_time), "dd/MM/yyyy HH:mm")
                : "N/A"}
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="flex flex-wrap gap-x-6 gap-y-2 items-center text-gray-600 dark:text-gray-300 text-sm mt-6"
      >
        <div className="flex items-center gap-2">
          <FiUser className="text-purple-500" />
          <span className="font-medium">
            Created by: {contest.owner?.username || "Unknown"}
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

        <div
          className={`font-bold uppercase flex items-center gap-1 ${statusColor}`}
        >
          <span>{contest.status}</span>
        </div>
      </motion.div>

      <div className="flex justify-end mt-6">{renderButton()}</div>
    </div>
  );
};

export default ContestDetail;
