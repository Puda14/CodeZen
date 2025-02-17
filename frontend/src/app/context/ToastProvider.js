"use client";

import { createContext, useContext } from "react";
import { toast, Toaster } from "react-hot-toast";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const showToast = (message, type = "info") => {
    switch (type) {
      case "success":
        toast.success(message || "Success! Action completed.");
        break;
      case "error":
        toast.error(message || "Error! Something went wrong.");
        break;
      case "warning":
        toast(message || "Warning! Be careful with this action.", {
          icon: "⚠️",
        });
        break;
      case "info":
        toast(message || "This is an update.", {
          icon: "ℹ️",
        });
        break;
      case "praise":
        toast(message || "🔥 Awesome! Keep up the great work!", {
          icon: "🔥👏",
        });
        break;
      default:
        toast(message || "👏 Hello.");
        break;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Toaster position="top-right" reverseOrder={false} />
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
