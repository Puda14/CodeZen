"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiLoader, FiLogIn } from "react-icons/fi";

import useCodeExecution from "@/hooks/useCodeExecution";
import MonacoCodeEditor from "@/components/MonacoCodeEditor";
import InputOutput from "@/components/InputOutput";
import ExecuteButtons from "@/components/ExecuteButtons";
import { useAuth } from "@/context/AuthContext";

const ExecutePage = () => {
  const {
    selectedKey,
    setSelectedKey,
    code,
    setCode,
    inputData,
    setInputData,
    output,
    handleExecute,
    isLoadingRun,
  } = useCodeExecution();

  const { isLoggedIn, isLoading: isLoadingAuth } = useAuth();
  const router = useRouter();
  const redirectPath = "/tools/execute";

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-8">
        <FiLoader className="animate-spin text-4xl text-blue-500" />
        <p className="mt-4 text-gray-700 dark:text-gray-300">
          Checking authentication...
        </p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-8 text-center">
        <FiLogIn size={48} className="text-blue-500 mb-4" />
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Login Required
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You need to be logged in to use the Code Sandbox.
        </p>
        <Link
          href={`/login?redirect=${redirectPath}`}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-150 ease-in-out"
        >
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-6"
        >
          <FiArrowLeft /> Back
        </button>

        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">
            Code Sandbox
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Write, run, and test your code snippets instantly.
          </p>
        </header>

        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-1">
            <MonacoCodeEditor
              code={code}
              onChange={setCode}
              selectedKey={selectedKey}
              setSelectedKey={setSelectedKey}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4">
            <ExecuteButtons
              selectedKey={selectedKey}
              setSelectedKey={setSelectedKey}
              handleExecute={handleExecute}
              isLoadingRun={isLoadingRun}
              isLoadingSubmit={false}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4">
            <InputOutput
              inputData={inputData}
              setInputData={setInputData}
              output={output}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutePage;
