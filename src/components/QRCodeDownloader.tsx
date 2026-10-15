"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useCallback } from "react";

import { renderQRToPNG } from "@/lib/qr-image";

interface QRCodeDownloaderProps {
  url: string;
  slug: string;
}

export default function QRCodeDownloader({ url, slug }: QRCodeDownloaderProps) {
  const handleDownload = useCallback(
    async (suffix: "light" | "dark") => {
      const fgColor = suffix === "light" ? "#09090b" : "#ffffff";
      const bgColor = suffix === "light" ? "#ffffff" : "#09090b";
      try {
        const pngDataUrl = await renderQRToPNG(url, fgColor, bgColor, 1024);
        const link = document.createElement("a");
        link.download = `qr-${slug}-${suffix}.png`;
        link.href = pngDataUrl;
        link.click();
      } catch (err) {
        console.error("Failed to generate QR download:", err);
      }
    },
    [slug, url]
  );

  const handleDownloadBoth = useCallback(async () => {
    await handleDownload("light");
    // Small delay so browser doesn't skip the second download
    setTimeout(() => handleDownload("dark"), 150);
  }, [handleDownload]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* QR Designs side by side */}
      <div className="flex items-center gap-4">
        {/* Light variant */}
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-xl bg-white p-3 shadow-lg shadow-accent/10">
            <QRCodeCanvas
              value={url}
              size={140}
              bgColor="#ffffff"
              fgColor="#09090b"
              level="H"
              marginSize={1}
            />
          </div>
          <button
            onClick={() => handleDownload("light")}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-all hover:border-accent/50 hover:text-accent active:scale-95 cursor-pointer"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Light
          </button>
        </div>

        {/* Dark variant */}
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-xl bg-[#09090b] p-3 shadow-lg shadow-accent/10">
            <QRCodeCanvas
              value={url}
              size={140}
              bgColor="#09090b"
              fgColor="#ffffff"
              level="H"
              marginSize={1}
            />
          </div>
          <button
            onClick={() => handleDownload("dark")}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-all hover:border-accent/50 hover:text-accent active:scale-95 cursor-pointer"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Dark
          </button>
        </div>
      </div>

      {/* Download Both */}
      <button
        onClick={handleDownloadBoth}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20 active:scale-95 cursor-pointer"
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
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Download Both
      </button>
    </div>
  );
}
