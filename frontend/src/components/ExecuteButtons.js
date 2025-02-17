export default function ExecuteButtons({
  handleExecute,
  handleCheckTestcase,
  isLoading,
  hideTestcase = false,
}) {
  return (
    <div className="flex justify-end space-x-4">
      <button
        onClick={handleExecute}
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-500"
      >
        Execute
      </button>

      {!hideTestcase && (
        <button
          onClick={handleCheckTestcase}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded hover:bg-green-700 focus:outline-none focus:ring focus:ring-green-500"
        >
          {isLoading ? "Checking..." : "Check Testcase"}
        </button>
      )}
    </div>
  );
}
