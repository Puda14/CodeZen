"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "../context/ToastProvider";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import Header from "../components/Layout/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <ThemeProvider>
      <ThemeWrapper>{children}</ThemeWrapper>
    </ThemeProvider>
  );
}

const ThemeWrapper = ({ children }) => {
  const { theme } = useTheme();

  return (
    <html lang="en" className={theme === "dark" ? "dark" : "light"}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-300 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        <Header />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
};
