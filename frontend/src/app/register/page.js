"use client";

import { useState } from "react";
import Link from "next/link";
import RegisterForm from "@/components/register/RegisterForm";
import VerificationPending from "@/components/register/VerificationPending";

const RegisterPage = () => {
  const [registrationStep, setRegistrationStep] = useState("form");
  const [userEmail, setUserEmail] = useState("");

  const handleRegistrationSuccess = (email) => {
    setUserEmail(email);
    setRegistrationStep("pending");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 space-y-6">
        {registrationStep === "form" ? (
          <>
            <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-200">
              Create Account
            </h1>
            <RegisterForm onSuccess={handleRegistrationSuccess} />
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Log in
              </Link>
            </p>
          </>
        ) : (
          <VerificationPending email={userEmail} />
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
