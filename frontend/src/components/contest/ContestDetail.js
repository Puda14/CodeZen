"use client";

const ContestDetail = ({ contest }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {contest.title}
      </h1>
      <p className="text-gray-700 dark:text-gray-300">{contest.description}</p>
      {/* Add more fields here */}
    </div>
  );
};

export default ContestDetail;
