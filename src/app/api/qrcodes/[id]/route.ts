import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isValidDestinationUrl } from "@/lib/url-validation";
import { COOKIE_NAME, verifyAdminSessionToken } from "@/lib/auth";
import { cookies } from "next/headers";

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

// PATCH /api/qrcodes/[id] — update destination_url only (slug is permanent)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await checkAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { destination_url?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { destination_url } = body;

  const trimmedUrl = destination_url ? destination_url.trim() : null;
  if (trimmedUrl !== null && !isValidDestinationUrl(trimmedUrl)) {
    return NextResponse.json(
      { error: "URL tujuan harus valid dan diawali dengan http:// atau https://" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("qrcodes")
    .update({ destination_url: trimmedUrl })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "QR code tidak ditemukan" }, { status: 404 });
  }

  if (data.slug) {
    revalidatePath(`/qr/${data.slug}`);
    revalidatePath(`/qr-inactive/${data.slug}`);
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
  const { data, error } = await supabase
    .from("qrcodes")
    .delete()
    .eq("id", id)
    .select("slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data?.slug) {
    revalidatePath(`/qr/${data.slug}`);
    revalidatePath(`/qr-inactive/${data.slug}`);
  }

  return NextResponse.json({ success: true });
}
