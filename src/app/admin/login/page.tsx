"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError("Passcode tidak boleh kosong");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Passcode salah. Silakan coba lagi.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8 shadow-2xl shadow-black/60 backdrop-blur-sm">
      {/* Brand Icon */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-purple-400 shadow-xl shadow-accent/30">
          <svg
            className="h-7 w-7 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          QRFlow Admin
        </h1>
        <p className="mt-1 text-xs text-muted">
          Masukkan passcode untuk mengakses dashboard manajemen
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="animate-fade-in mb-4 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-xs text-danger flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Login form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">
            Passcode Admin
          </label>
          <div className="relative flex items-center">
            <input
              type={showPasscode ? "text" : "password"}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              autoFocus
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder-muted/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPasscode(!showPasscode)}
              className="absolute right-3 text-muted hover:text-foreground transition-colors cursor-pointer"
              tabIndex={-1}
            >
              {showPasscode ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-hover active:scale-[0.99] disabled:opacity-50 cursor-pointer shadow-lg shadow-accent/20"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Memverifikasi...</span>
            </div>
          ) : (
            "Masuk Dashboard"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-[11px] text-muted">
        QRFlow Dynamic QR &bull; Akses Terbatas
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Suspense fallback={<div className="text-muted text-sm">Memuat...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
