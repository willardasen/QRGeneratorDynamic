"use client";

import { useState, type FormEvent } from "react";

interface CreateFormProps {
  onCreated: () => void;
  onToast: (message: string, type: "success" | "error") => void;
}

export default function CreateForm({ onCreated, onToast }: CreateFormProps) {
  const [slug, setSlug] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!slug.trim() || !destinationUrl.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/qrcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim(),
          destination_url: destinationUrl.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        onToast(data.error || "Failed to create QR code", "error");
        return;
      }

      setSlug("");
      setDestinationUrl("");
      onToast(`QR code "${data.slug}" created!`, "success");
      onCreated();
    } catch {
      onToast("Network error — please try again", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-5 text-lg font-semibold tracking-tight">
          Create New QR Link
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <label
              htmlFor="slug-input"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted"
            >
              Slug
            </label>
            <input
              id="slug-input"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-link"
              pattern="[a-zA-Z0-9_\-]+"
              required
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted transition-colors focus:border-accent"
            />
          </div>
          <div className="flex-[2]">
            <label
              htmlFor="url-input"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted"
            >
              Destination URL
            </label>
            <input
              id="url-input"
              type="url"
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="https://example.com/my-page"
              required
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted transition-colors focus:border-accent"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Creating…
                </span>
              ) : (
                "Create"
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
