"use client";

import CreateContestForm from "@/components/contest/CreateContestForm";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

const CreateContestPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/contests"
          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-flex"
        >
          <FiArrowLeft /> Back
        </Link>
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">
          Create New Contest
        </h1>
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-md">
          <CreateContestForm />
        </div>
      </div>
    </div>
  );
};

export default CreateContestPage;
