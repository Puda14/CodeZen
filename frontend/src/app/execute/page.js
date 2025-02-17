"use client";

import useCodeExecution from "../hooks/useCodeExecution";
import MonacoCodeEditor from "../components/MonacoCodeEditor";
import InputOutput from "../components/InputOutput";
import ExecuteButtons from "../components/ExecuteButtons";

const ExecutePage = () => {
  const {
    language,
    setLanguage,
    code,
    setCode,
    inputData,
    setInputData,
    output,
    handleExecute,
    isLoading,
  } = useCodeExecution();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200 text-center">
        Execute Code
      </h1>

      <div className="w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <MonacoCodeEditor
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={setLanguage}
          />
        </div>

        <div className="flex flex-col space-y-4">
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
              isLoading={isLoading}
              hideTestcase={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutePage;
