"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useCallback, useRef } from "react";

interface QRCodeDownloaderProps {
  url: string;
  slug: string;
}

export default function QRCodeDownloader({ url, slug }: QRCodeDownloaderProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `qr-${slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [slug]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={canvasRef}
        className="rounded-xl bg-white p-3 shadow-lg shadow-accent/10"
      >
        <QRCodeCanvas
          value={url}
          size={180}
          bgColor="#ffffff"
          fgColor="#09090b"
          level="H"
          marginSize={1}
        />
      </div>
      <button
        onClick={handleDownload}
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
        Download PNG
      </button>
    </div>
  );
}
