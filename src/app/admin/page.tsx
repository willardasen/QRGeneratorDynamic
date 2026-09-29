"use client";

import { useCallback, useEffect, useState } from "react";
import type { QRCode } from "@/lib/supabase";
import CreateForm from "@/components/CreateForm";
import QRLinkList from "@/components/QRLinkList";
import Toast from "@/components/Toast";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface ToastState {
  message: string;
  type: "success" | "error";
}

export default function AdminPage() {
  const [items, setItems] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/qrcodes");
      const data = await res.json();
      setItems(data);
    } catch {
      showToast("Failed to load QR codes", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="animate-fade-in mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-purple-400 shadow-lg shadow-accent/20">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">QRFlow</h1>
            <p className="text-sm text-muted">
              Dynamic QR codes · Edge-powered redirects
            </p>
          </div>
        </div>
      </div>

      {/* Create Form */}
      <div className="mb-8">
        <CreateForm onCreated={fetchItems} onToast={showToast} />
      </div>

      {/* Stats Bar */}
      {items.length > 0 && (
        <div className="animate-fade-in mb-5 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted">
            Your QR Links
            <span className="ml-2 rounded-full bg-surface-hover px-2 py-0.5 text-xs font-semibold text-foreground">
              {items.length}
            </span>
          </h2>
          <p className="text-xs text-muted">
            Total clicks:{" "}
            <span className="font-semibold text-foreground">
              {items
                .reduce((sum, i) => sum + i.clicks, 0)
                .toLocaleString()}
            </span>
          </p>
        </div>
      )}

      {/* Links List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg
            className="h-8 w-8 animate-spin text-accent"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      ) : (
        <QRLinkList
          items={items}
          appUrl={APP_URL}
          onUpdated={fetchItems}
          onToast={showToast}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </main>
  );
}
