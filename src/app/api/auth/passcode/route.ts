import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_NAME,
  COOKIE_OPTIONS,
  createAdminSessionToken,
} from "@/lib/auth";

// POST /api/auth/passcode
// Body: { passcode: string }
// Sets a signed, secure, HTTP-only session cookie upon successful verification
export async function POST(request: NextRequest) {
  const adminPasscode = process.env.ADMIN_PASSCODE;

  if (!adminPasscode) {
    console.error("ADMIN_PASSCODE is not set in environment variables");
    return NextResponse.json(
      { error: "Server configuration error: ADMIN_PASSCODE is not configured" },
      { status: 500 }
    );
  }

  let body: { passcode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { passcode } = body;

  if (!passcode || typeof passcode !== "string") {
    return NextResponse.json(
      { error: "Passcode is required" },
      { status: 400 }
    );
  }

  // Constant-time comparison to prevent timing attacks
  let mismatch = passcode.length ^ adminPasscode.length;
  for (let i = 0; i < Math.max(passcode.length, adminPasscode.length); i++) {
    const a = passcode.charCodeAt(i) || 0;
    const b = adminPasscode.charCodeAt(i) || 0;
    mismatch |= a ^ b;
  }
  if (mismatch !== 0) {
    return NextResponse.json(
      { error: "Passcode salah. Silakan coba lagi." },
      { status: 401 }
    );
  }

  try {
    const token = await createAdminSessionToken();
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
    return response;
  } catch (err) {
    console.error("Error creating session token:", err);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/passcode — logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, "", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
  return response;
}
