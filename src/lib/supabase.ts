import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type QRCode = {
  id: string;
  slug: string;
  destination_url: string;
  clicks: number;
  created_at: string;
};

let _supabase: SupabaseClient | null = null;

/**
 * Lazily-initialized Supabase client.
 * Prevents build-time crashes when env vars aren't set yet.
 */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
          "Copy .env.local.example to .env.local and fill in your Supabase credentials."
      );
    }

    _supabase = createClient(url, key);
  }

  return _supabase;
}
