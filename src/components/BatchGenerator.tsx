"use client";

import { useState, type FormEvent } from "react";

interface BatchGeneratorProps {
  onBatchCreated: () => void;
  onToast: (message: string, type: "success" | "error") => void;
}

export default function BatchGenerator({
  onBatchCreated,
  onToast,
}: BatchGeneratorProps) {
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!count || isNaN(count) || count < 1 || count > 500) {
      onToast("Jumlah QR code harus antara 1 dan 500", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/qrcodes/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();
      if (!res.ok) {
        onToast(data.error || "Batch generation failed", "error");
        return;
      }
      onToast(`✅ ${data.created} QR codes generated!`, "success");
      setIsOpen(false);
      onBatchCreated();
    } catch {
      onToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface py-3 text-sm font-medium text-muted transition-all hover:border-accent/50 hover:text-accent active:scale-95 cursor-pointer"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h16M4 18h7" />
        </svg>
        Batch Generate QR Codes
      </button>

      {isOpen && (
        <div className="mt-3 animate-fade-in rounded-2xl border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-semibold">
            🎲 Generate Empty QR Codes
          </h3>
          <p className="mb-4 text-xs text-muted">
            Creates multiple blank QR codes with sequential slugs (001, 002…).
            These can be printed and activated later in the field.
          </p>
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
                How many?
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={count === 0 ? "" : count}
                onChange={(e) => setCount(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-hover active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Creating…" : "Generate"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
