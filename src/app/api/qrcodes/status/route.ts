import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifyAdminSessionToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { setPrintedStatus } from "@/lib/printed-store";

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

// PATCH /api/qrcodes/status
// Body: { ids: string[], is_printed: boolean }
// Updates the printed/in-use status of QR codes
export async function PATCH(request: NextRequest) {
  const isAuth = await checkAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { ids?: string[]; is_printed?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { ids, is_printed } = body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: "ids must be a non-empty array of strings" },
      { status: 400 }
    );
  }

  if (typeof is_printed !== "boolean") {
    return NextResponse.json(
      { error: "is_printed must be a boolean" },
      { status: 400 }
    );
  }

  // 1. Update persistent local store
  setPrintedStatus(ids, is_printed);

  // 2. Also attempt to update Supabase if the column exists
  try {
    const supabase = getSupabaseAdmin();
    const { error: dbErr } = await supabase
      .from("qrcodes")
      .update({ is_printed })
      .in("id", ids);
    if (dbErr) {
      console.warn("Could not sync is_printed to Supabase (migration might not be applied yet):", dbErr.message);
    }
  } catch (err) {
    console.warn("Could not connect to Supabase to sync is_printed:", err);
  }

  return NextResponse.json({
    success: true,
    updated: ids.length,
    is_printed,
  });
}
