import { cookies } from "next/headers";
import { COOKIE_NAME, verifyAdminSessionToken } from "@/lib/auth";
import MagicActivate from "@/components/MagicActivate";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function QRInactivePage({ params }: PageProps) {
  const { slug } = await params;

  // Check if admin is already logged in (skip passcode step)
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const isAdmin = await verifyAdminSessionToken(token);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Status badge */}
      <div className="mb-8 flex flex-col items-center gap-5">
        {/* Animated QR icon */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-surface shadow-2xl shadow-black/40">
          <svg
            className="h-12 w-12 text-muted/40"
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
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
            !
          </span>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            QR Code Belum Aktif
          </h1>
          <p className="mt-2 text-sm text-muted">
            Kode QR{" "}
            <span className="font-mono font-semibold text-foreground">
              #{slug}
            </span>{" "}
            belum diarahkan ke halaman manapun.
          </p>
        </div>

        {/* Info card */}
        <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-4 text-center">
          <p className="text-xs text-muted">
            Jika Anda menerima QR ini dari tim penjualan kami, harap hubungi
            kami untuk informasi lebih lanjut.
          </p>
        </div>
      </div>

      {/* Magic Activation Widget */}
      <div className="w-full max-w-sm">
        <MagicActivate slug={slug} isAdminLoggedIn={isAdmin} />
      </div>
    </main>
  );
}
