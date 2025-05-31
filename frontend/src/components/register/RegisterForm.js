"use client";

import { useState } from "react";
import { useToast } from "@/context/ToastProvider";
import api from "@/utils/api";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const RegisterForm = ({ onSuccess }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.email ||
      !form.username ||
      !form.password ||
      !form.confirmPassword
    ) {
      showToast("Please fill in all fields.", "warning");
      return;
    }
    if (form.password !== form.confirmPassword) {
      showToast("Passwords do not match.", "warning");
      return;
    }
    if (form.password.length < 6) {
      showToast("Password must be at least 6 characters long.", "warning");
      return;
    }

    setIsLoading(true);
    try {
      const { username, email, password } = form;
      const response = await api.post("/auth/register", {
        username,
        email,
        password,
      });
      showToast(
        response.data.message ||
          "Registration successful! Please check your email to verify your account.",
        "success"
      );
      if (onSuccess) {
        onSuccess(form.email);
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Registration failed. Please try again.";
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Username
        </label>
        <input
          type="text"
          name="username"
          value={form.username}
          onChange={handleChange}
          placeholder="your username"
          className="mt-1 w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:border-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          className="mt-1 w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:border-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="mt-1 w-full px-4 py-2 pr-10 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:border-blue-500"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label="Toggle password visibility"
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
          >
            {showPassword ? (
              <FaEyeSlash className="w-5 h-5" />
            ) : (
              <FaEye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            className="mt-1 w-full px-4 py-2 pr-10 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:border-blue-500"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label="Toggle confirm password visibility"
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
          >
            {showConfirmPassword ? (
              <FaEyeSlash className="w-5 h-5" />
            ) : (
              <FaEye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition duration-150 ease-in-out"
      >
        {isLoading ? "Registering..." : "Register"}
      </button>
    </form>
  );
};

export default RegisterForm;
