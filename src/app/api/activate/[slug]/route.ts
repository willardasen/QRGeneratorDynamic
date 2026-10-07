import { getSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// POST /api/activate/[slug]
// Activates an unassigned QR code by setting its destination_url
// Requires admin cookie
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Check admin cookie
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("qrflow_admin");
  if (!adminCookie || adminCookie.value !== "1") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { destination_url } = body;

  if (!destination_url || !destination_url.startsWith("http")) {
    return NextResponse.json(
      { error: "A valid destination URL is required" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("qrcodes")
    .update({ destination_url })
    .eq("slug", slug)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "QR code not found" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
