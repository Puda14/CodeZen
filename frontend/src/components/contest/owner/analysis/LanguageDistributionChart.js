"use client";

import React, { useMemo } from "react";
import { FiCode } from "react-icons/fi";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AA336A",
  "#FF69B4",
  "#8A2BE2",
  "#A52A2A",
  "#DEB887",
  "#5F9EA0",
];

const LanguageDistributionChart = ({ processorCounts, title }) => {
  const chartData = useMemo(() => {
    if (!processorCounts) return [];
    return Object.entries(processorCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [processorCounts]);

  if (!processorCounts || chartData.length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow h-full">
        <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
          <FiCode className="mr-2 text-lg" /> {title}
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          No language data available.
        </p>
      </div>
    );
  }

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
    name,
    value,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const percentage = (percent * 100).toFixed(0);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize="10px"
      >
        {`${name} (${percentage}%)`}
      </text>
    );
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow h-full">
      <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
        <FiCode className="mr-2 text-lg" /> {title}
      </h4>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${value} submission${value !== 1 ? "s" : ""}`,
                name,
              ]}
            />
            <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LanguageDistributionChart;
