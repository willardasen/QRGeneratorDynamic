"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface MagicActivateProps {
  slug: string;
  isAdminLoggedIn?: boolean;
}

type Stage = "idle" | "passcode" | "activate" | "done";

export default function MagicActivate({ slug, isAdminLoggedIn }: MagicActivateProps) {
  const [stage, setStage] = useState<Stage>(isAdminLoggedIn ? "activate" : "idle");

  const [passcode, setPasscode] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handlePasscode = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (!res.ok) {
        setError("Passcode salah. Coba lagi.");
        return;
      }
      setStage("activate");
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/activate/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination_url: url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mengaktifkan QR code.");
        return;
      }
      setStage("done");
      // Redirect to the now-active link after 2s
      setTimeout(() => router.push(url), 2000);
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  if (stage === "done") {
    return (
      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center">
        <div className="text-4xl">✅</div>
        <p className="font-semibold text-green-400">QR Code Berhasil Diaktifkan!</p>
        <p className="text-sm text-muted">Mengalihkan ke tujuan...</p>
      </div>
    );
  }

  if (stage === "activate") {
    return (
      <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/10 p-6">
        <p className="mb-4 text-sm font-semibold text-accent">
          🔗 Aktifkan QR <span className="font-mono">/{slug}</span>
        </p>
        <form onSubmit={handleActivate} className="flex flex-col gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://wa.me/628123456789"
            required
            autoFocus
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-white transition-all hover:bg-accent-hover active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Mengaktifkan..." : "Aktifkan Sekarang"}
          </button>
          <button
            type="button"
            onClick={() => setStage("idle")}
            className="text-xs text-muted underline cursor-pointer"
          >
            Batal
          </button>
        </form>
      </div>
    );
  }

  if (stage === "passcode") {
    return (
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <p className="mb-4 text-sm font-semibold text-muted">
          🔐 Masukkan kode admin
        </p>
        <form onSubmit={handlePasscode} className="flex flex-col gap-3">
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="••••••••"
            required
            autoFocus
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-surface-hover py-3 text-sm font-semibold text-foreground transition-all hover:bg-border active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Memverifikasi..." : "Masuk"}
          </button>
          <button
            type="button"
            onClick={() => setStage("idle")}
            className="text-xs text-muted underline cursor-pointer"
          >
            Batal
          </button>
        </form>
      </div>
    );
  }

  // Stage: idle — show the small discreet admin button
  return (
    <div className="mt-10 flex justify-center">
      <button
        onClick={() => setStage("passcode")}
        className="rounded-lg px-4 py-2 text-xs text-muted/40 transition-colors hover:text-muted cursor-pointer"
      >
        Admin Login
      </button>
    </div>
  );
}
