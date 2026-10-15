import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Returns a server-side Supabase client with administrative / service-role capabilities.
 * Strictly requires SUPABASE_SERVICE_ROLE_KEY to bypass Row Level Security.
 * Never falls back to the public anonymous key.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in environment variables.");
    }

    if (!serviceKey) {
      throw new Error(
        "Missing SUPABASE_SERVICE_ROLE_KEY in environment variables. Backend admin operations strictly require the service_role secret key."
      );
    }

    _supabaseAdmin = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return _supabaseAdmin;
}
