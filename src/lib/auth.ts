export const COOKIE_NAME = "qrflow_admin";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24, // 24 hours
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

/**
 * Derives a cryptographic HMAC-SHA256 signature for the admin session.
 * Uses Web Crypto API (SubtleCrypto) which works across Node.js, Edge, and Proxy runtimes.
 */
async function signMessage(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Creates a signed admin session token: `${timestamp}.${hmac}`.
 */
export async function createAdminSessionToken(): Promise<string> {
  const passcode = process.env.ADMIN_PASSCODE;
  if (!passcode) {
    throw new Error("ADMIN_PASSCODE environment variable is not configured");
  }
  const timestamp = Date.now().toString();
  const signature = await signMessage(timestamp, passcode);
  return `${timestamp}.${signature}`;
}

/**
 * Verifies if an admin session token is authentic and not expired.
 * Also supports legacy session value "1" during transition if needed in non-production.
 */
export async function verifyAdminSessionToken(
  token?: string | null
): Promise<boolean> {
  if (!token) return false;

  const passcode = process.env.ADMIN_PASSCODE;
  if (!passcode) return false;

  // Fallback for transition in local development
  if (token === "1" && process.env.NODE_ENV !== "production") {
    return true;
  }

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Check expiration (24 hours)
  const MAX_AGE_MS = 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > MAX_AGE_MS || timestamp > Date.now() + 60000) {
    return false;
  }

  try {
    const expectedSignature = await signMessage(timestampStr, passcode);
    // Constant-time bitwise comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) return false;
    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
      mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    return mismatch === 0;
  } catch {
    return false;
  }
}
