"use client";

import { useCallback, useEffect, useState } from "react";
import type { QRCode } from "@/lib/supabase";
import CreateForm from "@/components/CreateForm";
import QRLinkList from "@/components/QRLinkList";
import Toast from "@/components/Toast";
import BatchGenerator from "@/components/BatchGenerator";
import QRZipDownload from "@/components/QRZipDownload";

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
  const [tab, setTab] = useState<"create" | "batch">("create");

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/qrcodes");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
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

  const activeCount = items.filter((i) => !!i.destination_url).length;
  const unassignedCount = items.filter((i) => !i.destination_url).length;
  const totalClicks = items.reduce((sum, i) => sum + i.clicks, 0);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="animate-fade-in mb-6 flex items-center gap-3">
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

      {/* Stats Row */}
      {!loading && (
        <div className="animate-fade-in mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-border bg-surface p-3 text-center">
            <p className="text-xl font-bold text-foreground">{items.length}</p>
            <p className="text-[11px] text-muted">Total QRs</p>
          </div>
          <div className="rounded-2xl border border-success/20 bg-success/5 p-3 text-center">
            <p className="text-xl font-bold text-success">{activeCount}</p>
            <p className="text-[11px] text-success/70">Active</p>
          </div>
          <div className="rounded-2xl border border-danger/20 bg-danger/5 p-3 text-center">
            <p className="text-xl font-bold text-danger">{unassignedCount}</p>
            <p className="text-[11px] text-danger/70">Unassigned</p>
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

      {/* List header with total clicks + zip download */}
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
          <QRZipDownload items={items} appUrl={APP_URL} />
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
