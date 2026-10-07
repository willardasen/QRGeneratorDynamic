import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Force Edge Runtime for lowest latency globally
export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Look up the slug
  const { data, error } = await supabase
    .from("qrcodes")
    .select("id, destination_url")
    .eq("slug", slug)
    .single();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Slug not found in DB at all
  if (error || !data) {
    return NextResponse.redirect(
      new URL(`/not-found-qr`, baseUrl),
      302
    );
  }

  // Condition B: Unassigned — show "Belum Aktif" activation page
  if (!data.destination_url) {
    return NextResponse.redirect(
      new URL(`/qr-inactive/${slug}`, baseUrl),
      302
    );
  }

  // Condition A: Active — increment clicks (fire-and-forget) and redirect
  supabase.rpc("increment_clicks", { row_id: data.id }).then(() => {});

  return NextResponse.redirect(data.destination_url, 302);
}
