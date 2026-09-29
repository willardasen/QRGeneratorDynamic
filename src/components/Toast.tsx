"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`animate-toast fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-medium shadow-2xl backdrop-blur-sm ${
        type === "success"
          ? "bg-success/90 text-white"
          : "bg-danger/90 text-white"
      }`}
    >
      <span className="text-lg">{type === "success" ? "✓" : "✕"}</span>
      {message}
    </div>
  );
}
