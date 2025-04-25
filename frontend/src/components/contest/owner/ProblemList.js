"use client";

import { useState } from "react";
import { FiChevronDown, FiChevronUp, FiPlus } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import ProblemInfo from "@/components/contest/owner/problem/ProblemInfo";
import ProblemTestcases from "@/components/contest/owner/problem/ProblemTestcases";
import CreateProblemForm from "@/components/contest/owner/problem/CreateProblemForm";
import Modal from "@/components/common/Modal";

/**
 * Displays a list of problems in a contest for the owner,
 * allowing expansion to view details and testcases,
 * and providing a button to open a modal for creating new problems.
 *
 * @param {Array} problems - Array of problem objects.
 * @param {Function} [onProblemsShouldRefresh] - Callback function to notify the parent component to refresh the problems list (e.g., after creating a new problem).
 * @param {Function} [onTestcaseUpdate] - Callback function passed down to ProblemTestcases (likely also triggers a refresh).
 */
const ProblemList = ({
  problems = [],
  onProblemsShouldRefresh,
  onTestcaseUpdate,
}) => {
  const [expandedId, setExpandedId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const contentVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: { duration: 0.3, ease: "easeInOut" },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: { duration: 0.2, ease: "easeInOut" },
    },
  };

  const handleRefreshFromChild = () => {
    if (onProblemsShouldRefresh) {
      onProblemsShouldRefresh();
    }
  };

  const handleInternalProblemCreated = () => {
    setShowCreateModal(false);
    if (onProblemsShouldRefresh) {
      onProblemsShouldRefresh();
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
  };

  const toggleExpand = (problemId) => {
    setExpandedId(expandedId === problemId ? null : problemId);
  };

  if (!problems || problems.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            Problems (0)
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded shadow text-sm font-medium"
          >
            <FiPlus size={16} /> New Problem
          </button>
        </div>
        <p className="text-gray-500 dark:text-gray-400 italic">
          No problems added to this contest yet.
        </p>
        <Modal
          isOpen={showCreateModal}
          onClose={handleCloseModal}
          title="Create New Problem"
          maxWidthClass="max-w-7xl"
        >
          <CreateProblemForm
            onProblemCreated={handleInternalProblemCreated}
            onCancel={handleCloseModal}
          />
        </Modal>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          Problems ({problems.length})
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded shadow text-sm font-medium"
        >
          <FiPlus size={16} /> New Problem
        </button>
      </div>

      {/* Create Problem Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        title="Create New Problem"
        maxWidthClass="max-w-4xl"
      >
        <CreateProblemForm
          onProblemCreated={handleInternalProblemCreated}
          onCancel={handleCloseModal}
        />
      </Modal>

      {/* List of Existing Problems */}
      <div className="space-y-4">
        {problems.map((problem, index) => {
          const isExpanded = expandedId === problem._id;
          const currentProblemId = problem._id;

          if (!currentProblemId) {
            console.warn("Problem missing _id at index:", index, problem);
            return null;
          }

          return (
            <div
              key={currentProblemId}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200" // Added rounded-lg
            >
              <div
                className="flex justify-between items-center cursor-pointer p-4 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => toggleExpand(currentProblemId)}
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Problem {index + 1}
                </h3>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isExpanded ? (
                    <FiChevronUp className="text-xl text-gray-600 dark:text-gray-400" />
                  ) : (
                    <FiChevronDown className="text-xl text-gray-600 dark:text-gray-400" />
                  )}
                </motion.div>
              </div>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="content"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="px-4 pb-4 pt-2 space-y-6 overflow-hidden border-t border-gray-200 dark:border-gray-700" // Add padding/border top
                  >
                    <ProblemInfo
                      problem={problem}
                      onProblemDeleted={handleRefreshFromChild}
                    />
                    <ProblemTestcases
                      testcases={problem.testcases || []}
                      problemId={currentProblemId}
                      onUpdateSuccess={onTestcaseUpdate}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProblemList;
