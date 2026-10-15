"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { QRCode } from "@/lib/supabase";
import CreateForm from "@/components/CreateForm";
import QRLinkList from "@/components/QRLinkList";
import Toast from "@/components/Toast";
import BatchGenerator from "@/components/BatchGenerator";
import QRZipDownload from "@/components/QRZipDownload";
import type { QRMode } from "@/components/QRZipDownload";

interface ToastState {
  message: string;
  type: "success" | "error";
}

export default function AdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [tab, setTab] = useState<"create" | "batch">("create");
  const [downloadMode, setDownloadMode] = useState<QRMode>("light");

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
  }, []);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
      ? process.env.NEXT_PUBLIC_APP_URL
      : typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/qrcodes");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      showToast("Gagal memuat daftar QR code", "error");
    } finally {
      setLoading(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await fetch("/api/qrcodes");
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        const data = await res.json();
        if (isMounted) {
          setItems(Array.isArray(data) ? data : []);
        }
      } catch {
        if (isMounted) {
          showToast("Gagal memuat daftar QR code", "error");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [router, showToast]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/passcode", { method: "DELETE" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  };

  const activeCount = items.filter((i) => !!i.destination_url).length;
  const printedCount = items.filter((i) => !i.destination_url && Boolean(i.is_printed)).length;
  const blankCount = items.filter((i) => !i.destination_url && !i.is_printed).length;
  const totalClicks = items.reduce((sum, i) => sum + i.clicks, 0);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="animate-fade-in mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-purple-400 shadow-lg shadow-accent/20">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">QRFlow</h1>
            <p className="text-xs text-muted">Dynamic QR · Door-to-Door Edition</p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted hover:text-danger hover:border-danger/30 transition-all cursor-pointer shadow-sm"
          title="Keluar dari sesi admin"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Keluar</span>
        </button>
      </div>

      {/* Stats Row */}
      {!loading && (
        <div className="animate-fade-in mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-3 text-center">
            <p className="text-xl font-bold text-foreground">{items.length}</p>
            <p className="text-[11px] text-muted">Total QRs</p>
          </div>
          <div className="rounded-2xl border border-success/20 bg-success/5 p-3 text-center">
            <p className="text-xl font-bold text-success">{activeCount}</p>
            <p className="text-[11px] text-success/80">Active</p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
            <p className="text-xl font-bold text-amber-400">{printedCount}</p>
            <p className="text-[11px] text-amber-400/80">🖨️ Printed (In Field)</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/60 p-3 text-center">
            <p className="text-xl font-bold text-muted">{blankCount}</p>
            <p className="text-[11px] text-muted">📄 Blank</p>
          </div>
        </div>
      )}

      {/* Create / Batch tabs */}
      <div className="mb-4 flex gap-1 rounded-xl bg-surface p-1">
        <button
          onClick={() => setTab("create")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all cursor-pointer ${
            tab === "create"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          ✏️ Create Single
        </button>
        <button
          onClick={() => setTab("batch")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all cursor-pointer ${
            tab === "batch"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          📦 Batch Generate
        </button>
      </div>

      {/* Create Form */}
      <div className="mb-6">
        {tab === "create" ? (
          <CreateForm onCreated={fetchItems} onToast={showToast} />
        ) : (
          <BatchGenerator onBatchCreated={fetchItems} onToast={showToast} />
        )}
      </div>

      {/* List header with total clicks + mode toggle + zip download */}
      {items.length > 0 && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              QR Codes
            </span>
            <span className="ml-2 rounded-full bg-surface-hover px-2 py-0.5 text-xs font-bold text-foreground">
              {items.length}
            </span>
            <span className="ml-3 text-xs text-muted">
              👆 {totalClicks.toLocaleString()} total clicks
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Light/Dark toggle for Download All */}
            <div className="flex items-center rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setDownloadMode("light")}
                className={`px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  downloadMode === "light"
                    ? "bg-white text-gray-900"
                    : "bg-transparent text-muted hover:text-foreground"
                }`}
                title="Light mode"
              >
                ☀️
              </button>
              <button
                onClick={() => setDownloadMode("dark")}
                className={`px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  downloadMode === "dark"
                    ? "bg-gray-900 text-white"
                    : "bg-transparent text-muted hover:text-foreground"
                }`}
                title="Dark mode"
              >
                🌙
              </button>
            </div>
            <QRZipDownload items={items} appUrl={appUrl} mode={downloadMode} />
          </div>
        </div>
      )}

      {/* Links List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="h-8 w-8 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <QRLinkList
          items={items}
          appUrl={appUrl}
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
