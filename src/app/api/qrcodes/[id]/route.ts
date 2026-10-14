import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";
import { isValidDestinationUrl } from "@/lib/url-validation";
import { COOKIE_NAME, verifyAdminSessionToken } from "@/lib/auth";
import { cookies } from "next/headers";

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

// PATCH /api/qrcodes/[id] — update destination_url
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuth = await checkAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { destination_url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { destination_url } = body;

  if (!destination_url) {
    return NextResponse.json(
      { error: "destination_url is required" },
      { status: 400 }
    );
  }

  if (!isValidDestinationUrl(destination_url)) {
    return NextResponse.json(
      { error: "Destination must be a valid HTTP or HTTPS URL" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("qrcodes")
    .update({ destination_url: destination_url.trim() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "QR code not found" }, { status: 404 });
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

  return NextResponse.json({ success: true });
}
