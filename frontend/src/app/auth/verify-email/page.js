"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/utils/api";
import { useToast } from "@/context/ToastProvider";
function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setMessage(
        "No verification token found. Please check the link or try again."
      );
      setStatus("error");
      showToast("Invalid verification link: No token.", "error");
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        setMessage(response.data.message || "Email verified successfully!");
        setStatus("success");
        showToast(
          "Email verified successfully! You can now log in.",
          "success"
        );
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } catch (err) {
        const errMsg =
          err.response?.data?.message ||
          "Email verification failed. The link may be invalid or expired.";
        setMessage(errMsg);
        setStatus("error");
        showToast(errMsg, "error");
      }
    };

    verifyToken();
  }, [searchParams, router, showToast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 text-center space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
          Email Verification
        </h1>
        <p
          className={`text-lg ${
            status === "success" ? "text-green-600 dark:text-green-400" : ""
          } ${status === "error" ? "text-red-600 dark:text-red-400" : ""} ${
            status === "verifying" ? "text-gray-700 dark:text-gray-300" : ""
          }`}
        >
          {message}
        </p>
        {status === "success" && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You will be redirected to the login page shortly.
          </p>
        )}
        {(status === "error" || status === "success") && (
          <Link
            href="/login"
            className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Go to Login
          </Link>
        )}
        {status === "error" && (
          <Link
            href="/register"
            className="inline-block mt-4 ml-2 border border-gray-300 hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Try Registering Again
          </Link>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
