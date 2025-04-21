"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import api from "@/utils/coreApi";

const AddParticipantsModal = ({ contestId, onClose, onSuccess }) => {
  const [emailsText, setEmailsText] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const emails = emailsText
      .split(/[\n,;]/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (emails.length === 0) return;

    setLoading(true);
    try {
      const res = await api.post(`/contest/${contestId}/add-participants`, {
        emails,
      });
      setResults(res.data.results);

      if (typeof onSuccess === "function") {
        onSuccess();
      }
    } catch (err) {
      setResults([
        {
          email: "System",
          status: "failed",
          message: err?.response?.data?.message || "Unknown error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-lg space-y-4"
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Add Participants by Email
        </h2>

        <textarea
          rows={5}
          placeholder="Enter emails, separated by comma or newline"
          className="w-full p-3 border rounded dark:bg-gray-900 dark:text-white"
          value={emailsText}
          onChange={(e) => setEmailsText(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={handleSend}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>

        {results && (
          <div className="mt-4 max-h-64 overflow-y-auto border-t border-gray-300 dark:border-gray-600 pt-3 space-y-2 pr-2">
            {results.map((r, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 text-sm ${
                  r.status === "success"
                    ? "text-green-600"
                    : "text-red-500 dark:text-red-400"
                }`}
              >
                {r.status === "success" ? (
                  <FiCheckCircle className="mt-[2px]" />
                ) : (
                  <FiXCircle className="mt-[2px]" />
                )}
                <span>
                  <strong>{r.email}</strong>: {r.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AddParticipantsModal;
