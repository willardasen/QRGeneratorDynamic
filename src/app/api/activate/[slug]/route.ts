import { getSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// POST /api/activate/[slug]
// Activates an unassigned QR code by setting its destination_url
// Optionally renames the slug via new_slug in the body
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
  const { destination_url, new_slug } = body;

  if (!destination_url || !destination_url.startsWith("http")) {
    return NextResponse.json(
      { error: "A valid destination URL is required" },
      { status: 400 }
    );
  }

  // Validate new_slug if provided
  if (new_slug !== undefined && new_slug !== slug) {
    if (!new_slug || !/^[a-zA-Z0-9-]+$/.test(new_slug)) {
      return NextResponse.json(
        { error: "Slug hanya boleh berisi huruf, angka, dan tanda hubung (-)" },
        { status: 400 }
      );
    }
  }

  const supabase = getSupabase();

  // Build the update payload
  const updatePayload: Record<string, string> = { destination_url };
  if (new_slug && new_slug !== slug) {
    updatePayload.slug = new_slug;
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
        { error: "Slug ini sudah digunakan oleh QR lain" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error?.message || "QR code not found" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
