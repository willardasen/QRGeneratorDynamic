import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";
import { isValidDestinationUrl, isValidSlug } from "@/lib/url-validation";
import { COOKIE_NAME, verifyAdminSessionToken } from "@/lib/auth";
import { cookies } from "next/headers";

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

// GET /api/qrcodes — fetch all QR codes
export async function GET() {
  const isAuth = await checkAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("qrcodes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/qrcodes — create a new QR code
export async function POST(request: NextRequest) {
  const isAuth = await checkAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { slug?: string; destination_url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { slug, destination_url } = body;

  if (!slug || !destination_url) {
    return NextResponse.json(
      { error: "Slug and destination URL are required" },
      { status: 400 }
    );
  }

  if (!isValidSlug(slug)) {
    return NextResponse.json(
      { error: "Slug must contain only letters, numbers, and hyphens (up to 100 characters)" },
      { status: 400 }
    );
  }

  if (!isValidDestinationUrl(destination_url)) {
    return NextResponse.json(
      { error: "Destination must be a valid HTTP or HTTPS URL (e.g., https://example.com)" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("qrcodes")
    .insert({ slug: slug.trim(), destination_url: destination_url.trim() })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Slug ini sudah digunakan oleh QR code lain" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
