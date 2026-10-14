"use client";

import { useState, type FormEvent } from "react";
import type { QRCode } from "@/lib/supabase";
import QRCodeDownloader from "./QRCodeDownloader";
import type { QRMode } from "./QRZipDownload";

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
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "unassigned">("all");
  const [search, setSearch] = useState("");

  // Selection state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [downloadMode, setDownloadMode] = useState<QRMode>("light");

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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allFilteredIds = filtered.map((i) => i.id);
    const allSelected = allFilteredIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const selectedItems = items.filter((i) => selectedIds.has(i.id));
  const allFilteredSelected = filtered.length > 0 && filtered.every((i) => selectedIds.has(i.id));

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
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
      onUpdated();
    } catch {
      onToast("Network error", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const executeBulkDelete = async () => {
    setConfirmBulkDelete(false);
    const toDelete = [...selectedIds];
    let deleted = 0;
    for (const id of toDelete) {
      try {
        const res = await fetch(`/api/qrcodes/${id}`, { method: "DELETE" });
        if (res.ok) deleted++;
      } catch { /* skip */ }
    }
    onToast(`${deleted} QR code${deleted !== 1 ? "s" : ""} deleted`, "success");
    setSelectedIds(new Set());
    onUpdated();
  };

  const handleBulkDownload = async () => {
    if (selectedItems.length === 0) return;
    setBulkDownloading(true);

    const fgColor = downloadMode === "light" ? "#09090b" : "#ffffff";
    const bgColor = downloadMode === "light" ? "#ffffff" : "#09090b";

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      for (const item of selectedItems) {
        const url = `${appUrl}/qr/${item.slug}`;
        const png = await renderQRToPNG(url, fgColor, bgColor);
        zip.file(`qr-${item.slug}-${downloadMode}.png`, png.split(",")[1], { base64: true });
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.download = `qrflow-selected-${downloadMode}-${Date.now()}.zip`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Bulk download failed:", err);
      onToast("Download failed", "error");
    } finally {
      setBulkDownloading(false);
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

      {/* Select mode toggle + Select All */}
      <div className="mb-2 flex items-center gap-3 px-1">
        <button
          onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            selectMode
              ? "bg-accent/20 text-accent"
              : "bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
          }`}
        >
          {selectMode ? "✕ Cancel" : "☑ Select"}
        </button>
        {selectMode && (
          <>
            <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-border accent-accent cursor-pointer"
              />
              Select all ({filtered.length})
            </label>
            {selectedIds.size > 0 && (
              <span className="text-xs text-accent font-medium">
                {selectedIds.size} selected
              </span>
            )}
          </>
        )}
      </div>

      {/* QR items */}
      <div className="space-y-2.5">
        {filtered.map((item, index) => {
          const isActive = !!item.destination_url;
          const isSelected = selectedIds.has(item.id);
          return (
            <div
              key={item.id}
              className={`animate-slide-up rounded-2xl border transition-all hover:border-accent/20 ${
                isSelected
                  ? "border-accent/40 bg-accent/5"
                  : "border-border bg-surface"
              }`}
              style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
            >
              <div className="flex items-center gap-3 p-4">
                {/* Selection checkbox (only in select mode) */}
                {selectMode && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(item.id)}
                    className="h-4 w-4 shrink-0 rounded border-border accent-accent cursor-pointer"
                  />
                )}

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

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 animate-fade-in">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <span className="text-sm font-semibold text-foreground">
              {selectedIds.size} selected
            </span>
            <div className="h-5 w-px bg-border" />

            {/* Light/Dark mode toggle */}
            <div className="flex items-center rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setDownloadMode("light")}
                className={`px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  downloadMode === "light"
                    ? "bg-white text-gray-900"
                    : "bg-transparent text-muted hover:text-foreground"
                }`}
                title="Light mode QR"
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
                title="Dark mode QR"
              >
                🌙
              </button>
            </div>

            {/* Download selected */}
            <button
              onClick={handleBulkDownload}
              disabled={bulkDownloading}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-accent-hover active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {bulkDownloading ? (
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              {bulkDownloading ? "…" : "Download"}
            </button>

            {/* Delete selected */}
            <button
              onClick={() => setConfirmBulkDelete(true)}
              className="flex items-center gap-1.5 rounded-lg bg-danger/90 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-danger active:scale-95 cursor-pointer"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
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

      {/* Delete Confirmation Modal (single) */}
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

      {/* Bulk Delete Confirmation Modal */}
      {confirmBulkDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setConfirmBulkDelete(false)}
        >
          <div
            className="animate-fade-in relative w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-lg font-bold text-foreground">Hapus {selectedIds.size} QR Code?</h3>
            <p className="mb-6 text-sm text-muted">
              Apakah Anda yakin ingin menghapus <span className="font-bold text-foreground">{selectedIds.size}</span> QR code yang dipilih? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmBulkDelete(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={executeBulkDelete}
                className="rounded-lg bg-danger px-4 py-2 text-sm font-bold text-white shadow-lg shadow-danger/20 transition-all hover:bg-danger/80 active:scale-95 cursor-pointer"
              >
                Hapus {selectedIds.size} QR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper: render a QR code to PNG data URL
async function renderQRToPNG(
  value: string,
  fgColor: string,
  bgColor: string
): Promise<string> {
  return new Promise((resolve) => {
    const size = 300;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(canvas, value, {
        width: size,
        margin: 2,
        color: { dark: fgColor, light: bgColor },
      }).then(() => {
        resolve(canvas.toDataURL("image/png"));
      });
    });
  });
}
