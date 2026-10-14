import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifyAdminSessionToken } from "@/lib/auth";
import { cookies } from "next/headers";

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

// POST /api/qrcodes/batch
// Body: { count: number }
// Creates `count` new QR codes with sequential slugs and NULL destination_url
export async function POST(request: NextRequest) {
  const isAuth = await checkAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { count?: number | string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const count = typeof body.count === "string" ? parseInt(body.count, 10) : Number(body.count);

  if (!count || isNaN(count) || count < 1 || count > 500) {
    return NextResponse.json(
      { error: "Count must be an integer between 1 and 500" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Get existing slugs to continue numeric sequence
  const { data: existing, error: fetchError } = await supabase
    .from("qrcodes")
    .select("slug");

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  // Find the highest numeric slug value
  let maxNum = 0;
  if (existing) {
    for (const row of existing) {
      const num = parseInt(row.slug, 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }

  // Build the batch insert payload
  const rows = Array.from({ length: count }, (_, i) => {
    const num = maxNum + i + 1;
    const slug = String(num).padStart(3, "0"); // e.g. "001", "002"
    return { slug, destination_url: null };
  });

  const { data, error } = await supabase
    .from("qrcodes")
    .insert(rows)
    .select();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Slug conflict occurred. Please retry." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { created: data?.length ?? 0, items: data },
    { status: 201 }
  );
}
