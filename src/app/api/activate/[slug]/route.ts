import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { COOKIE_NAME, verifyAdminSessionToken } from "@/lib/auth";
import { isValidDestinationUrl } from "@/lib/url-validation";

// POST /api/activate/[slug]
// Activates an unassigned QR code by setting its destination_url
// and automatically sets is_printed: true
// Requires admin session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Check admin session token
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const isAuth = await verifyAdminSessionToken(token);

  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { destination_url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { destination_url } = body;

  if (!isValidDestinationUrl(destination_url)) {
    return NextResponse.json(
      { error: "URL tujuan harus valid dan diawali dengan http:// atau https://" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Destination URL is activated and is_printed is marked true
  const { data, error } = await supabase
    .from("qrcodes")
    .update({
      destination_url: destination_url!.trim(),
      is_printed: true,
    })
    .eq("slug", slug)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "QR code tidak ditemukan" },
      { status: 500 }
    );
  }

  // Invalidate any edge/client cache immediately so test scans redirect correctly
  revalidatePath(`/qr/${slug}`);
  revalidatePath(`/qr-inactive/${slug}`);

  return NextResponse.json(data);
}
