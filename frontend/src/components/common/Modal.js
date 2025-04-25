// src/components/common/Modal.js
"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";

const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  maxWidthClass = "max-w-3xl",
}) => {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const modalVariants = {
    hidden: { opacity: 0, y: -50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.3, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      y: 50,
      scale: 0.95,
      transition: { duration: 0.2, ease: "easeIn" },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            key="modal"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className={`fixed inset-0 z-50 m-auto w-11/12 ${maxWidthClass} h-fit max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden`}
          >
            {/* Header */}
            {(title || onClose) && (
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                {title && (
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    {title}
                  </h2>
                )}
                {onClose && (
                  <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label="Close modal"
                  >
                    <FiX size={24} />
                  </button>
                )}
              </div>
            )}

            {/* Body (Scrollable) */}
            {/* --- THÊM w-full VÀO ĐÂY --- */}
            <div className="p-6 overflow-y-auto flex-grow w-full">
              {/* --- KẾT THÚC THÊM --- */}
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;
