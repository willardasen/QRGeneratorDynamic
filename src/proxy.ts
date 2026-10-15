import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifyAdminSessionToken } from "@/lib/auth";

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/qrcodes",
    "/api/qrcodes/:path*",
    "/api/activate/:path*",
  ],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const isAuthenticated = await verifyAdminSessionToken(token);

  // If user is accessing the login page
  if (pathname === "/admin/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // If authenticated, allow request to proceed
  if (isAuthenticated) {
    return NextResponse.next();
  }

  // Handle unauthorized requests
  // For API routes: return 401 JSON
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Unauthorized: Admin session required" },
      { status: 401 }
    );
  }

  // For admin web pages: redirect to login page with callbackUrl
  const loginUrl = new URL("/admin/login", request.url);
  const fullPath = pathname + request.nextUrl.search;
  loginUrl.searchParams.set("callbackUrl", fullPath);
  return NextResponse.redirect(loginUrl);
}
