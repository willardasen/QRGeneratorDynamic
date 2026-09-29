import { getSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// GET /api/qrcodes — fetch all QR codes
export async function GET() {
  const supabase = getSupabase();
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
  const body = await request.json();
  const { slug, destination_url } = body;

  if (!slug || !destination_url) {
    return NextResponse.json(
      { error: "slug and destination_url are required" },
      { status: 400 }
    );
  }

  // Validate slug format (alphanumeric + hyphens only)
  if (!/^[a-zA-Z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "slug must be alphanumeric (hyphens allowed)" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("qrcodes")
    .insert({ slug, destination_url })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "This slug is already taken" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
