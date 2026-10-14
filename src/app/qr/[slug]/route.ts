import { getSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse, after } from "next/server";
import { isValidDestinationUrl } from "@/lib/url-validation";

function createNoCacheRedirect(url: string | URL, status: number = 302): NextResponse {
  const response = NextResponse.redirect(url, status);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = getSupabase();

  // Look up the slug
  const { data, error } = await supabase
    .from("qrcodes")
    .select("id, destination_url")
    .eq("slug", slug)
    .single();

  // Dynamic base URL: use request Host header so phone stays on the network IP, never on phone's localhost
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || (request.url.startsWith("https") ? "https" : "http");
  const requestOrigin = host ? `${proto}://${host}` : null;
  const baseUrl =
    requestOrigin && !requestOrigin.includes("localhost")
      ? requestOrigin
      : (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
          ? process.env.NEXT_PUBLIC_APP_URL
          : (requestOrigin || request.nextUrl.origin));

  // Slug not found in DB at all
  if (error || !data) {
    return createNoCacheRedirect(new URL("/not-found-qr", baseUrl));
  }

  // Condition B: Unassigned — show "Belum Aktif" activation page
  if (!data.destination_url) {
    return createNoCacheRedirect(new URL(`/qr-inactive/${slug}`, baseUrl));
  }

  // Sanity check destination URL format to prevent malformed or dangerous redirects
  if (!isValidDestinationUrl(data.destination_url)) {
    console.warn(`QR slug "${slug}" has invalid destination URL: "${data.destination_url}"`);
    return createNoCacheRedirect(new URL("/not-found-qr", baseUrl));
  }

  // Condition A: Active — schedule non-blocking click increment after response has finished
  after(async () => {
    try {
      await supabase.rpc("increment_clicks", { row_id: data.id });
    } catch (rpcErr) {
      console.error("Failed to increment clicks for slug:", slug, rpcErr);
    }
  });

  // Redirect to destination with aggressive anti-caching headers
  return createNoCacheRedirect(data.destination_url);
}
