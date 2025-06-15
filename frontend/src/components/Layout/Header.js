"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiSun, FiMoon, FiUser } from "react-icons/fi";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { metadata } from "@/data/metadata";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const { isLoggedIn, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="w-full z-50 bg-white dark:bg-gray-800 shadow-md">
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
      <link rel="icon" href={metadata.logo} type="image/x-icon" />

      <nav className="bg-white dark:bg-gray-800 border-gray-200 px-4 lg:px-6 py-2.5">
        <div className="flex justify-between items-center mx-auto max-w-screen-xl">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img src={metadata.logo} className="h-6 sm:h-9 mr-3" alt="Logo" />
            <span className="text-xl font-semibold dark:text-white">
              {metadata.name}
            </span>
          </Link>

          {/* Desktop menu*/}
          <div className="hidden lg:flex gap-6 items-center font-medium">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white"
            >
              Home
            </Link>
            <Link
              href="/contests"
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white"
            >
              Contests
            </Link>
            <Link
              href="/tools"
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white"
            >
              Tools
            </Link>
          </div>

          {/* Right-side buttons */}
          <div className="flex items-center gap-2 lg:order-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              {theme === "dark" ? (
                <FiSun className="w-5 h-5 text-yellow-500" />
              ) : (
                <FiMoon className="w-5 h-5 text-gray-700" />
              )}
            </button>

            {/* Auth */}
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  <FiUser className="text-xl text-gray-800 dark:text-gray-200" />
                </button>
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-[60]">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:block text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-gray-700 font-medium rounded-lg text-sm px-4 py-2 focus:outline-none"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:block border text-gray-800 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700 font-medium rounded-lg text-sm px-4 py-2 focus:outline-none"
                >
                  Get started
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <span className="sr-only">Open menu</span>
              <svg
                className={`w-6 h-6 ${isMobileMenuOpen ? "hidden" : "block"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3 5h14a1 1 0 010 2H3a1 1 0 110-2zm0 5h14a1 1 0 010 2H3a1 1 0 110-2zm0 5h14a1 1 0 010 2H3a1 1 0 110-2z"
                  clipRule="evenodd"
                />
              </svg>
              <svg
                className={`w-6 h-6 ${isMobileMenuOpen ? "block" : "hidden"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 space-y-4">
            <ul className="flex flex-col space-y-2 font-medium">
              <li>
                <Link
                  href="/"
                  className="block px-2 py-1 text-blue-700 dark:text-white"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/contests"
                  className="block px-2 py-1 text-gray-700 dark:text-gray-300"
                >
                  Contests
                </Link>
              </li>
            </ul>

            {!isLoggedIn && (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  className="block text-center text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-gray-700 font-medium rounded-lg text-sm px-4 py-2"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="block text-center border text-gray-800 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700 font-medium rounded-lg text-sm px-4 py-2"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
