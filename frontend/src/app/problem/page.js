"use client";

import useFetchProblem from "../hooks/useFetchProblem";
import useCodeExecution from "../hooks/useCodeExecution";
import ProblemDescription from "../components/ProblemDescription";
import InputOutput from "../components/InputOutput";
import ExecuteButtons from "../components/ExecuteButtons";
import TestcaseResults from "../components/TestcaseResults";
import MonacoCodeEditor from "../components/MonacoCodeEditor";

const ProblemPage = () => {
  const { problemDescription } = useFetchProblem();
  const {
    language,
    setLanguage,
    code,
    setCode,
    inputData,
    setInputData,
    output,
    handleExecute,
    handleCheckTestcase,
    testcaseResults,
    isLoading,
  } = useCodeExecution();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200 text-center">
        Problem Page
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mx-auto">
        <ProblemDescription problemDescription={problemDescription} />

        <div className="flex flex-col space-y-3">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <MonacoCodeEditor
              code={code}
              setCode={setCode}
              language={language}
              setLanguage={setLanguage}
            />
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <InputOutput
              inputData={inputData}
              setInputData={setInputData}
              output={output}
            />
          </div>

          <div className="p-4">
            <ExecuteButtons
              handleExecute={handleExecute}
              handleCheckTestcase={handleCheckTestcase}
              isLoading={isLoading}
            />
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <TestcaseResults
              isLoading={isLoading}
              testcaseResults={testcaseResults}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemPage;
