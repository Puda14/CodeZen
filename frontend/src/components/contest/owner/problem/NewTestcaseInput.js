import { FiTrash2 } from "react-icons/fi";
import { testcaseTimeoutLimits } from "@/config/contestConfig";

const NewTestcaseInput = ({
  testcase,
  index,
  onChange,
  onRemove,
  isSaving,
}) => {
  const handleFieldChange = (field, value) => {
    let processedValue = value;
    if (field === "score") {
      const numValue = parseInt(value, 10);
      processedValue = isNaN(numValue) || numValue < 0 ? 0 : numValue;
    } else if (field === "isPublic") {
      processedValue = value === "true";
    } else if (field === "timeout") {
      if (value !== "") {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue)) {
          return;
        }
        if (numValue < testcaseTimeoutLimits.min) {
          processedValue = testcaseTimeoutLimits.min;
        } else if (numValue > testcaseTimeoutLimits.max) {
          processedValue = testcaseTimeoutLimits.max;
        } else {
          processedValue = numValue;
        }
      }
    }
    onChange(index, field, processedValue);
  };

  return (
    <div className="p-3 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm relative">
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-3 right-3 text-red-500 hover:text-red-700 disabled:opacity-50 p-1 z-10 transition-colors"
        disabled={isSaving}
        title="Remove this testcase"
      >
        <FiTrash2 size={16} />
      </button>

      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Testcase #{index + 1}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label
            htmlFor={`problem-input-${index}`}
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5"
          >
            Input <span className="text-red-500">*</span>
          </label>
          <textarea
            id={`problem-input-${index}`}
            value={testcase.input || ""}
            onChange={(e) => handleFieldChange("input", e.target.value)}
            required
            rows={3}
            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-y font-mono"
            disabled={isSaving}
            placeholder="Testcase input"
          />
        </div>
        <div>
          <label
            htmlFor={`problem-output-${index}`}
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5"
          >
            Output <span className="text-red-500">*</span>
          </label>
          <textarea
            id={`problem-output-${index}`}
            value={testcase.output || ""}
            onChange={(e) => handleFieldChange("output", e.target.value)}
            required
            rows={3}
            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-y font-mono"
            disabled={isSaving}
            placeholder="Expected output"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
        <div>
          <label
            htmlFor={`problem-score-${index}`}
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5"
          >
            Score <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id={`problem-score-${index}`}
            value={testcase.score ?? 0}
            onChange={(e) => handleFieldChange("score", e.target.value)}
            required
            min="0"
            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            disabled={isSaving}
            placeholder="Points"
          />
        </div>

        <div>
          <label
            htmlFor={`problem-timeout-${index}`}
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5"
          >
            Timeout (s) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id={`problem-timeout-${index}`}
            value={testcase.timeout ?? ""}
            onChange={(e) => handleFieldChange("timeout", e.target.value)}
            required
            min={testcaseTimeoutLimits.min}
            max={testcaseTimeoutLimits.max}
            step="1"
            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            disabled={isSaving}
            placeholder={`${testcaseTimeoutLimits.min}-${testcaseTimeoutLimits.max}s`}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Range: {testcaseTimeoutLimits.min}s - {testcaseTimeoutLimits.max}s.
          </p>
        </div>

        <div>
          <label
            htmlFor={`problem-visibility-${index}`}
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Visibility:
          </label>
          <select
            id={`problem-visibility-${index}`}
            value={String(testcase.isPublic)}
            onChange={(e) => handleFieldChange("isPublic", e.target.value)}
            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-70"
            disabled={isSaving}
          >
            <option value="true">Public</option>
            <option value="false">Private</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default NewTestcaseInput;
