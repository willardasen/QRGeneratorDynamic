"use client";

import { useState, type FormEvent } from "react";
import type { QRCode } from "@/lib/supabase";
import QRCodeDownloader from "./QRCodeDownloader";

interface QRLinkListProps {
  items: QRCode[];
  appUrl: string;
  onUpdated: () => void;
  onToast: (message: string, type: "success" | "error") => void;
}

export default function QRLinkList({
  items,
  appUrl,
  onUpdated,
  onToast,
}: QRLinkListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [qrModalSlug, setQrModalSlug] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const startEdit = (item: QRCode) => {
    setEditingId(item.id);
    setEditUrl(item.destination_url);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditUrl("");
  };

  const saveEdit = async (e: FormEvent, id: string) => {
    e.preventDefault();
    if (!editUrl.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/qrcodes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination_url: editUrl.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        onToast(data.error || "Failed to update", "error");
        return;
      }

      onToast("Destination updated!", "success");
      cancelEdit();
      onUpdated();
    } catch {
      onToast("Network error", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, slug: string) => {
    if (!confirm(`Delete QR code "/${slug}"? This cannot be undone.`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/qrcodes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        onToast("Failed to delete", "error");
        return;
      }
      onToast(`"${slug}" deleted`, "success");
      onUpdated();
    } catch {
      onToast("Network error", "error");
    } finally {
      setDeletingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
        <div className="mb-3 text-4xl">📱</div>
        <p className="text-lg font-medium text-muted">No QR codes yet</p>
        <p className="mt-1 text-sm text-muted/70">
          Create your first dynamic QR link above
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="animate-slide-up group rounded-2xl border border-border bg-surface transition-all hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              {/* Left: slug + destination */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <span className="shrink-0 rounded-md bg-accent/10 px-2.5 py-1 font-mono text-sm font-semibold text-accent">
                    /qr/{item.slug}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-surface-hover px-2.5 py-1 text-xs font-medium text-muted">
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                      />
                    </svg>
                    {item.clicks.toLocaleString()} click
                    {item.clicks !== 1 ? "s" : ""}
                  </span>
                </div>

                {editingId === item.id ? (
                  <form
                    onSubmit={(e) => saveEdit(e, item.id)}
                    className="mt-3 flex gap-2"
                  >
                    <input
                      type="url"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors focus:border-accent"
                      autoFocus
                      required
                    />
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-success/90 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-success active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {saving ? "…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-all hover:bg-surface-hover active:scale-95 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <p className="mt-2 truncate text-sm text-muted">
                    → {item.destination_url}
                  </p>
                )}

                <p className="mt-1.5 text-xs text-muted/50">
                  Created{" "}
                  {new Date(item.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Right: actions */}
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => setQrModalSlug(item.slug)}
                  title="Show QR Code"
                  className="rounded-lg border border-border p-2.5 text-muted transition-all hover:border-accent/50 hover:text-accent hover:shadow-md hover:shadow-accent/10 active:scale-95 cursor-pointer"
                >
                  <svg
                    className="h-4 w-4"
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
                </button>
                {editingId !== item.id && (
                  <button
                    onClick={() => startEdit(item)}
                    title="Edit destination"
                    className="rounded-lg border border-border p-2.5 text-muted transition-all hover:border-accent/50 hover:text-accent hover:shadow-md hover:shadow-accent/10 active:scale-95 cursor-pointer"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item.id, item.slug)}
                  disabled={deletingId === item.id}
                  title="Delete"
                  className="rounded-lg border border-border p-2.5 text-muted transition-all hover:border-danger/50 hover:text-danger hover:shadow-md hover:shadow-danger/10 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* QR Code Modal */}
      {qrModalSlug && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setQrModalSlug(null)}
        >
          <div
            className="animate-fade-in relative rounded-2xl border border-border bg-surface p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQrModalSlug(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted transition-colors hover:text-foreground cursor-pointer"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h3 className="mb-1 text-center text-lg font-semibold">
              QR Code
            </h3>
            <p className="mb-5 text-center font-mono text-sm text-muted">
              /qr/{qrModalSlug}
            </p>
            <QRCodeDownloader
              url={`${appUrl}/qr/${qrModalSlug}`}
              slug={qrModalSlug}
            />
          </div>
        </div>
      )}
    </>
  );
}
