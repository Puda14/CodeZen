"use client";
import React from "react";

const OverallStatCard = ({
  title,
  value,
  icon: Icon,
  iconColorClass = "text-blue-500 dark:text-blue-400",
}) => {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex items-center">
        {Icon && <Icon className={`h-7 w-7 ${iconColorClass} mr-4`} />}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OverallStatCard;
