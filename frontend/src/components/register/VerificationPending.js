"use client";

import { useState } from "react";
import { useToast } from "@/context/ToastProvider";
import api from "@/utils/api";
import Link from "next/link";

const VerificationPending = ({ email }) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleResendVerification = async () => {
    if (!email) {
      showToast("Email not provided.", "error");
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post("/auth/resend-verification", { email });
      showToast(
        response.data.message ||
          "Verification email resent. Please check your inbox.",
        "success"
      );
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to resend verification email.";
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="text-center space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
        Verify Your Email
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        A verification email has been sent to <strong>{email}</strong>. Please
        check your inbox (and spam folder) to complete your registration.
      </p>
      <p className="text-gray-600 dark:text-gray-400">
        Didn't receive the email?
      </p>
      <button
        onClick={handleResendVerification}
        disabled={isLoading}
        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2.5 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 transition duration-150 ease-in-out"
      >
        {isLoading ? "Sending..." : "Resend Verification Email"}
      </button>
      <div className="mt-6">
        <Link
          href="/login"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default VerificationPending;
