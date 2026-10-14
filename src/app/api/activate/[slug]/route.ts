import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyAdminSessionToken } from "@/lib/auth";
import { isValidDestinationUrl, isValidSlug } from "@/lib/url-validation";

// POST /api/activate/[slug]
// Activates an unassigned QR code by setting its destination_url
// Optionally renames the slug via new_slug in the body
// Requires admin session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Check admin session token
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const isAuth = await verifyAdminSessionToken(token);

  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { destination_url?: string; new_slug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { destination_url, new_slug } = body;

  if (!isValidDestinationUrl(destination_url)) {
    return NextResponse.json(
      { error: "URL tujuan harus valid dan diawali dengan http:// atau https://" },
      { status: 400 }
    );
  }

  // Validate new_slug if provided
  if (new_slug !== undefined && new_slug !== slug) {
    if (!isValidSlug(new_slug)) {
      return NextResponse.json(
        { error: "Slug hanya boleh berisi huruf, angka, tanda hubung (-), dan garis bawah (_)" },
        { status: 400 }
      );
    }
  }

  const supabase = getSupabaseAdmin();

  // Build the update payload
  const updatePayload: Record<string, string> = {
    destination_url: destination_url!.trim(),
  };
  if (new_slug && new_slug !== slug) {
    updatePayload.slug = new_slug.trim();
  }

  const { data, error } = await supabase
    .from("qrcodes")
    .update(updatePayload)
    .eq("slug", slug)
    .select()
    .single();

  if (error || !data) {
    // Unique constraint violation on slug
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Slug ini sudah digunakan oleh QR code lain" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error?.message || "QR code tidak ditemukan" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
