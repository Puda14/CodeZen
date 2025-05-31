"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiLoader, FiLogIn } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import CreateContestForm from "@/components/contest/CreateContestForm";
import { useToast } from "@/context/ToastProvider";

const CreateContestPage = () => {
  const { isLoggedIn, isLoading: isLoadingAuth } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isLoadingAuth && !isLoggedIn && !hasRedirected.current) {
      hasRedirected.current = true;
      showToast("Please log in to create a contest.", "warning");
      router.push("/login?redirect=/contests/create");
    }
  }, [isLoggedIn, isLoadingAuth, router, showToast]);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-8">
        <FiLoader className="animate-spin text-4xl text-blue-500" />
        <p className="mt-4 text-gray-700 dark:text-gray-300">
          Loading authentication...
        </p>
      </div>
    );
  }

  if (!isLoggedIn && !isLoadingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-8 text-center">
        <FiLogIn size={48} className="text-blue-500 mb-4" />
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You need to be logged in to create a new contest.
        </p>
        <Link
          href="/login?redirect=/contests/create"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-150 ease-in-out"
        >
          Log In
        </Link>
      </div>
    );
  }

  if (isLoggedIn && !isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/contests"
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            <FiArrowLeft /> Back to Contests
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
  }

  return null;
};

export default CreateContestPage;
