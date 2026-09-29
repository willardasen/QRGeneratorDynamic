import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Force Edge Runtime for lowest latency globally
export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Create a lightweight Supabase client for the edge
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Look up the slug
  const { data, error } = await supabase
    .from("qrcodes")
    .select("id, destination_url")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "QR code not found" },
      { status: 404 }
    );
  }

  // 2. Increment click counter (fire-and-forget for speed)
  supabase.rpc("increment_clicks", { row_id: data.id }).then(() => {});

  // 3. Fast 302 redirect
  return NextResponse.redirect(data.destination_url, 302);
}
