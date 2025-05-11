"use client";

import React, { useMemo } from "react";
import { FiBarChart2 } from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const STATUS_COLORS = {
  Accepted: "#22C55E",
  "Wrong Answer": "#EF4444",
  "Partial Score": "#3B82F6",
  "Time Limit Exceeded": "#EAB308",
  "Compilation Error": "#F97316",
  "Runtime Error": "#8B5CF6",
  "Memory Limit Exceeded": "#6366F1",
  "Segmentation Fault": "#EC4899",
  Error: "#DC2626",
  "Evaluation Issue": "#F59E0B",
  Processing: "#6B7280",
  "No Test Cases / Pending": "#9CA3AF",
  Graded: "#10B981",
};

const StatusDistributionChart = ({ statusCounts, title }) => {
  const chartData = useMemo(() => {
    if (!statusCounts) return [];
    return Object.entries(statusCounts)
      .map(([name, value]) => ({ name, count: value }))
      .sort((a, b) => b.count - a.count);
  }, [statusCounts]);

  if (!statusCounts || chartData.length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow h-full">
        <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
          <FiBarChart2 className="mr-2 text-lg" /> {title}
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          No status data available.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow h-full">
      <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
        <FiBarChart2 className="mr-2 text-lg" /> {title}
      </h4>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 0, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              interval={0}
              height={70}
              style={{ fontSize: "10px" }}
            />
            <YAxis
              allowDecimals={false}
              style={{ fontSize: "10px" }}
              width={30}
            />
            <Tooltip
              wrapperStyle={{ fontSize: "12px" }}
              formatter={(value, name) => [
                value,
                name === "count" ? "Submissions" : name,
              ]}
            />
            <Legend
              iconSize={10}
              wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
            />
            <Bar dataKey="count" name="Submissions">
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={STATUS_COLORS[entry.name] || "#8884d8"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatusDistributionChart;
