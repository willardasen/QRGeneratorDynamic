import { getSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// POST /api/qrcodes/batch
// Body: { count: number, prefix?: string }
// Creates `count` new QR codes with sequential slugs and NULL destination_url
export async function POST(request: NextRequest) {
  const body = await request.json();
  const count = parseInt(body.count, 10);

  if (!count || count < 1 || count > 500) {
    return NextResponse.json(
      { error: "count must be between 1 and 500" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // Get the highest existing numeric slug to continue the sequence
  const { data: existing } = await supabase
    .from("qrcodes")
    .select("slug")
    .order("created_at", { ascending: false });

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
    // Might be slug conflict — try with random suffix
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Some slugs already exist. Please try again." },
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
