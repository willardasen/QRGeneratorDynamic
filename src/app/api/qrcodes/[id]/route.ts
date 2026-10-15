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

// PATCH /api/qrcodes/[id] — update slug and/or destination_url
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await checkAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { destination_url?: string | null; slug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { destination_url, slug } = body;

  if (destination_url === undefined && slug === undefined) {
    return NextResponse.json(
      { error: "Setidaknya slug atau destination_url harus diberikan" },
      { status: 400 }
    );
  }

  const updatePayload: Record<string, string | null> = {};

  if (slug !== undefined) {
    const trimmedSlug = slug.trim();
    if (!isValidSlug(trimmedSlug)) {
      return NextResponse.json(
        { error: "Slug hanya boleh berisi huruf, angka, tanda hubung (-), dan garis bawah (_)" },
        { status: 400 }
      );
    }
    updatePayload.slug = trimmedSlug;
  }

  if (destination_url !== undefined) {
    const trimmedUrl = destination_url ? destination_url.trim() : null;
    if (trimmedUrl !== null && !isValidDestinationUrl(trimmedUrl)) {
      return NextResponse.json(
        { error: "URL tujuan harus valid dan diawali dengan http:// atau https://" },
        { status: 400 }
      );
    }
    updatePayload.destination_url = trimmedUrl;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("qrcodes")
    .update(updatePayload)
    .eq("id", id)
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

  if (!data) {
    return NextResponse.json({ error: "QR code tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// DELETE /api/qrcodes/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await checkAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("qrcodes").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { removePrintedIds } = await import("@/lib/printed-store");
  removePrintedIds([id]);

  return NextResponse.json({ success: true });
}
