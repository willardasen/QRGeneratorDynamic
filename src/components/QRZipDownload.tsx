"use client";

import { useState } from "react";
import type { QRCode } from "@/lib/supabase";

interface QRZipDownloadProps {
  items: QRCode[];
  appUrl: string;
}

export default function QRZipDownload({ items, appUrl }: QRZipDownloadProps) {
  const [loading, setLoading] = useState(false);

  const handleDownloadAll = async () => {
    if (items.length === 0) return;
    setLoading(true);

    try {
      // Dynamically import heavy libs only when needed
      const [{ QRCodeCanvas }, JSZip] = await Promise.all([
        import("qrcode.react"),
        import("jszip").then((m) => m.default),
      ]);

      const zip = new JSZip();

      // Render each QR to canvas and export as PNG
      for (const item of items) {
        const url = `${appUrl}/qr/${item.slug}`;
        const png = await renderQRToPNG(url, QRCodeCanvas);
        zip.file(`qr-${item.slug}.png`, png.split(",")[1], { base64: true });
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.download = `qrflow-batch-${Date.now()}.zip`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("ZIP generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownloadAll}
      disabled={loading || items.length === 0}
      className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted transition-all hover:border-accent/50 hover:text-accent active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      title="Download all as ZIP"
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )}
      {loading ? "Packing…" : `Download All (${items.length})`}
    </button>
  );
}

// Helper: render a QR code value to a PNG data URL using an off-screen canvas
async function renderQRToPNG(
  value: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _QRCodeCanvas: any
): Promise<string> {
  return new Promise((resolve) => {
    const size = 300;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // Use qrcode library to draw on canvas
    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(canvas, value, {
        width: size,
        margin: 2,
        color: { dark: "#09090b", light: "#ffffff" },
      }).then(() => {
        resolve(canvas.toDataURL("image/png"));
      });
    });
  });
}
