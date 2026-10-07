import { NextRequest, NextResponse } from "next/server";

// POST /api/auth/passcode
// Body: { passcode: string }
// Returns a cookie if correct
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { passcode } = body;

  const correct = process.env.ADMIN_PASSCODE || "qrflow2024";

  if (passcode !== correct) {
    return NextResponse.json({ error: "Wrong passcode" }, { status: 401 });
  }

  // Set an httpOnly cookie to mark admin session (24h)
  const response = NextResponse.json({ success: true });
  response.cookies.set("qrflow_admin", "1", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return response;
}

// DELETE /api/auth/passcode — logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("qrflow_admin");
  return response;
}
