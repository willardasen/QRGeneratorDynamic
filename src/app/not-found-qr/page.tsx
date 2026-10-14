import Link from "next/link";

export default function NotFoundQRPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        {/* QR 404 Visual */}
        <div className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-3xl border border-border bg-surface shadow-2xl shadow-black/50">
          <svg
            className="h-14 w-14 text-muted/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
          <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-danger text-white shadow-lg">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          QR Code Tidak Ditemukan
        </h1>

        <p className="mt-3 text-sm text-muted">
          Tautan QR code yang Anda tuju belum terdaftar, telah dihapus, atau kode slug salah.
        </p>

        <div className="mt-6 w-full rounded-2xl border border-border bg-surface/50 p-4 text-xs text-muted">
          <p>
            Pastikan Anda memindai kode QR fisik yang resmi dan tidak rusak. Jika masalah berlanjut, hubungi penyedia layanan.
          </p>
        </div>

        <div className="mt-8 flex gap-3">
          <Link
            href="/admin"
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-hover shadow-lg shadow-accent/20"
          >
            Buka Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
