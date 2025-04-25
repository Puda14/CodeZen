"use client";

import { motion, AnimatePresence } from "framer-motion";

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-sm"
        >
          <p className="text-center text-gray-800 dark:text-gray-100 mb-6 text-lg font-medium">
            {message}
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
            >
              Confirm
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmModal;
