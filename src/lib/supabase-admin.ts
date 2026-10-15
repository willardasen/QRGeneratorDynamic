import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Returns a server-side Supabase client with administrative / service-role capabilities.
 * Uses SUPABASE_SERVICE_ROLE_KEY when available to bypass RLS in production.
 * Falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY if service key is not configured.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in environment variables.");
    }

    const key = serviceKey || anonKey;
    if (!key) {
      throw new Error(
        "Missing SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables."
      );
    }

    if (!serviceKey && process.env.NODE_ENV === "production") {
      console.warn(
        "⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY is not set in production. Using ANON key. Ensure Supabase RLS is configured appropriately."
      );
    }

    _supabaseAdmin = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return _supabaseAdmin;
}
