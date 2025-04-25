// src/app/ClientProviders.js
"use client"; // Đánh dấu đây là Client Component

import { useEffect } from "react";
import { ToastProvider } from "../context/ToastProvider";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { AuthProvider } from "../context/AuthContext";
import Header from "../components/Layout/Header"; // Import Header

// Component con để lấy theme và áp dụng class lên thẻ body (cần useEffect)
function ThemeApplicator({ children }) {
  const { theme } = useTheme();

  // Dùng useEffect để cập nhật class trên body một cách an toàn ở client-side
  useEffect(() => {
    const body = document.body;
    body.classList.remove("light", "dark"); // Xóa class cũ
    body.classList.add(theme); // Thêm class mới
  }, [theme]); // Chạy lại khi theme thay đổi

  // Render children bình thường, không cần thẻ html/body ở đây
  return <>{children}</>;
}

export default function ClientProviders({ children }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        {/* ToastProvider nên bao ngoài cùng hoặc trong cùng tùy thuộc context nào cần nó */}
        <ToastProvider>
          {/* ThemeApplicator sẽ lấy theme và áp dụng class */}
          <ThemeApplicator>
            {/* Header và children nằm trong các Provider */}
            <Header />
            {/* Phần nội dung chính của trang (page.js) sẽ nằm ở đây */}
            <main>{children}</main>
            {/* Có thể thêm Footer ở đây nếu cần */}
          </ThemeApplicator>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
