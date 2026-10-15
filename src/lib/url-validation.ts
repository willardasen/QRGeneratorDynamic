/**
 * Validates that a string is a safe, fully-qualified web URL (HTTP or HTTPS).
 * Rejects javascript:, data:, file:, relative URLs, and malformed strings.
 */
export function isValidDestinationUrl(url: unknown): boolean {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    // Allow only http and https protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    // Hostname must be present and not just empty or whitespace
    if (!parsed.hostname || parsed.hostname.length < 1) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a slug format: alphanumeric, hyphens, and underscores only.
 * Must be between 1 and 100 characters.
 */
export function isValidSlug(slug: unknown): boolean {
  if (typeof slug !== "string") return false;
  return /^[a-zA-Z0-9_-]{1,100}$/.test(slug);
}
