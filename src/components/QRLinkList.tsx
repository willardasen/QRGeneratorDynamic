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
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; slug: string } | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "unassigned">("all");
  const [search, setSearch] = useState("");

  const filtered = items.filter((item) => {
    const matchFilter =
      filter === "all"
        ? true
        : filter === "active"
        ? !!item.destination_url
        : !item.destination_url;
    const matchSearch =
      search === "" ||
      item.slug.toLowerCase().includes(search.toLowerCase()) ||
      (item.destination_url ?? "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const startEdit = (item: QRCode) => {
    setEditingId(item.id);
    setEditUrl(item.destination_url ?? "");
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

  const handleDelete = (id: string, slug: string) => {
    setConfirmDelete({ id, slug });
  };

  const executeDelete = async (id: string, slug: string) => {
    setConfirmDelete(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/qrcodes/${id}`, { method: "DELETE" });
      if (!res.ok) { onToast("Failed to delete", "error"); return; }
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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
        <div className="mb-3 text-4xl">📱</div>
        <p className="text-base font-medium text-muted">No QR codes yet</p>
        <p className="mt-1 text-sm text-muted/60">Generate your first batch above</p>
      </div>
    );
  }

  return (
    <>
      {/* Filter + Search bar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search slug or URL…"
          className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <div className="flex gap-1.5">
          {(["all", "active", "unassigned"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize transition-all cursor-pointer ${
                filter === f
                  ? f === "active"
                    ? "bg-success/20 text-success"
                    : f === "unassigned"
                    ? "bg-danger/20 text-danger"
                    : "bg-accent/20 text-accent"
                  : "bg-surface text-muted hover:bg-surface-hover"
              }`}
            >
              {f} (
              {f === "all"
                ? items.length
                : f === "active"
                ? items.filter((i) => !!i.destination_url).length
                : items.filter((i) => !i.destination_url).length}
              )
            </button>
          ))}
        </div>
      </div>

      {/* QR items */}
      <div className="space-y-2.5">
        {filtered.map((item, index) => {
          const isActive = !!item.destination_url;
          return (
            <div
              key={item.id}
              className="animate-slide-up rounded-2xl border border-border bg-surface transition-all hover:border-accent/20"
              style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
            >
              <div className="flex items-center gap-3 p-4">
                {/* Status dot */}
                <div
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    isActive ? "bg-success shadow-[0_0_6px_rgba(34,197,94,0.6)]" : "bg-danger shadow-[0_0_6px_rgba(239,68,68,0.6)]"
                  }`}
                />

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-foreground">
                      #{item.slug}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isActive
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger"
                      }`}
                    >
                      {isActive ? "Active" : "Unassigned"}
                    </span>
                    {isActive && (
                      <span className="flex items-center gap-0.5 rounded-full bg-surface-hover px-2 py-0.5 text-[10px] text-muted">
                        👆 {item.clicks}
                      </span>
                    )}
                  </div>

                  {editingId === item.id ? (
                    <form
                      onSubmit={(e) => saveEdit(e, item.id)}
                      className="mt-2 flex gap-2"
                    >
                      <input
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        autoFocus
                        required
                      />
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-success/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-success active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {saving ? "…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:bg-surface-hover active:scale-95 cursor-pointer"
                      >
                        ✕
                      </button>
                    </form>
                  ) : (
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {item.destination_url ?? (
                        <span className="italic text-muted/50">
                          No destination set
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                {editingId !== item.id && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => setQrModalSlug(item.slug)}
                      title="View QR Code"
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-accent cursor-pointer"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => startEdit(item)}
                      title="Edit destination"
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-accent cursor-pointer"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.slug)}
                      disabled={deletingId === item.id}
                      title="Delete"
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-danger active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-10 text-center text-sm text-muted">
          No results for your filter/search.
        </div>
      )}

      {/* QR Code Modal */}
      {qrModalSlug && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
          onClick={() => setQrModalSlug(null)}
        >
          <div
            className="animate-fade-in relative w-full max-w-sm rounded-t-3xl border border-border bg-surface p-6 shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQrModalSlug(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-foreground cursor-pointer"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="mb-1 text-center text-base font-bold">QR Code</h3>
            <p className="mb-5 text-center font-mono text-sm text-muted">#{qrModalSlug}</p>
            <QRCodeDownloader
              url={`${appUrl}/qr/${qrModalSlug}`}
              slug={qrModalSlug}
            />
            {/* Bottom handle for mobile */}
            <div className="mt-4 flex justify-center sm:hidden">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="animate-fade-in relative w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-lg font-bold text-foreground">Hapus QR Code?</h3>
            <p className="mb-6 text-sm text-muted">
              Apakah Anda yakin ingin menghapus QR code <span className="font-mono font-bold text-foreground">#{confirmDelete.slug}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => executeDelete(confirmDelete.id, confirmDelete.slug)}
                className="rounded-lg bg-danger px-4 py-2 text-sm font-bold text-white shadow-lg shadow-danger/20 transition-all hover:bg-danger/80 active:scale-95 cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
