"use client";

import useCodeExecution from "../../hooks/useCodeExecution";
import MonacoCodeEditor from "../../components/MonacoCodeEditor";
import InputOutput from "../../components/InputOutput";
import ExecuteButtons from "../../components/ExecuteButtons";

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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-8 sm:px-6 lg:px-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">
          Execute Code
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Write, run, and test your code snippets instantly.
        </p>
      </header>

      <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
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
  );
};

export default ExecutePage;
