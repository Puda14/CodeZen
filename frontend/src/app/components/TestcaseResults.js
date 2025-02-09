export default function TestcaseResults({ isLoading, testcaseResults }) {
  if (isLoading) return <p>Checking test cases...</p>;

  return (
    testcaseResults && (
      <div className="mt-0">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Testcase Results
        </h3>
        <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md border border-gray-300 dark:border-gray-700">
          <ul>
            {testcaseResults.results.map((test, index) => (
              <li
                key={index}
                className={`mb-2 ${
                  test.status === "passed" ? "text-green-600" : "text-red-600"
                }`}
              >
                Testcase {test.test_case}: {test.status}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">
            Summary: {testcaseResults.summary.passed} Passed /{" "}
            {testcaseResults.summary.failed} Failed /{" "}
            {testcaseResults.summary.total} Total
          </p>
        </div>
      </div>
    )
  );
}
