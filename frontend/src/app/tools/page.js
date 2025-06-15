"use client";

import { useRouter } from "next/navigation";
import { SparklesIcon, CommandLineIcon } from "@heroicons/react/24/outline";

export default function ToolsPage() {
  const router = useRouter();

  const tools = [
    {
      name: "AI Testcase Generator",
      description:
        "Automatically generate a wide range of test cases for your problems using AI.",
      icon: SparklesIcon,
      path: "/tools/testcase-generator",
      color: "text-purple-500 dark:text-purple-400",
    },
    {
      name: "Code Sandbox",
      description:
        "A simple and clean environment to run and test your code snippets instantly.",
      icon: CommandLineIcon,
      path: "/tools/execute",
      color: "text-sky-500 dark:text-sky-400",
    },
  ];

  const handleNavigation = (path) => {
    router.push(path);
  };

  return (
    <main className="container mx-auto px-4 py-12 sm:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Tools</h1>
        <p className="mt-3 text-lg max-w-2xl mx-auto text-gray-600 dark:text-gray-400">
          Powerful utilities to organize your contest and testing workflow.
          Choose a tool to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {tools.map((tool) => (
          <div
            key={tool.name}
            onClick={() => handleNavigation(tool.path)}
            className="group relative cursor-pointer overflow-hidden rounded-xl bg-white dark:bg-gray-800/50 p-8 shadow-lg border border-gray-200 dark:border-gray-700/50 transition-all duration-300 hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10 hover:border-blue-500/30 dark:hover:border-blue-400/30 hover:-translate-y-1"
          >
            <div className="mb-4">
              <tool.icon
                className={`h-12 w-12 ${tool.color}`}
                aria-hidden="true"
              />
            </div>
            <h2 className="text-2xl font-semibold mb-2">{tool.name}</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {tool.description}
            </p>
            <div className="absolute bottom-4 right-4 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
