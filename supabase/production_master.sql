-- =========================================================================
-- QRFlow Unified Production Master Migration
-- Target: Supabase (PostgreSQL) - Singapore (sin1)
-- Description: Complete schema, indexes, security (RLS), and atomic click counter.
-- Idempotent: Safe to run on a brand-new project or an existing prototype database.
-- =========================================================================

-- 1. Enable Required Extensions
create extension if not exists "uuid-ossp";

-- 2. Create or Harden `qrcodes` Table
create table if not exists qrcodes (
  id              uuid          default uuid_generate_v4() primary key,
  slug            text          not null unique,
  destination_url text          null,          -- NULL = unassigned / pending door-to-door activation
  clicks          integer       default 0 not null,
  created_at      timestamptz   default now() not null,
  is_printed      boolean       default false not null
);

-- Ensure `is_printed` column exists if upgrading an existing prototype table
alter table qrcodes
add column if not exists is_printed boolean default false not null;

-- Ensure `destination_url` allows NULL values for unassigned/blank QR codes
alter table qrcodes
alter column destination_url drop not null;

-- 3. Performance & Unique Indexes
-- Ultra-fast O(1) lookup during Edge redirect resolution
create unique index if not exists idx_qrcodes_slug on qrcodes (slug);

-- Fast sorting by newest first in admin dashboard
create index if not exists idx_qrcodes_created_at on qrcodes (created_at desc);

-- Fast filtering by printed status (Printed/In-Field vs Blank)
create index if not exists idx_qrcodes_is_printed on qrcodes (is_printed);

-- 4. Row Level Security (RLS) Hardening
alter table qrcodes enable row level security;

-- Drop prototype open-access policies if they exist
drop policy if exists "Allow anonymous insert" on qrcodes;
drop policy if exists "Allow anonymous update" on qrcodes;
drop policy if exists "Allow anonymous delete" on qrcodes;
drop policy if exists "Allow public select" on qrcodes;
drop policy if exists "Allow anonymous read" on qrcodes;

-- Allow public read access (SELECT): Required by Edge redirects & QR scanner lookups
create policy "Allow anonymous read" on qrcodes
  for select
  using (true);

-- NOTE: Mutations (INSERT, UPDATE, DELETE) are intentionally locked down.
-- Only server-side API routes using SUPABASE_SERVICE_ROLE_KEY will bypass RLS.
-- This prevents attackers from tampering with links directly via the public anon key.

-- 5. Atomic Click Increment Function (RPC)
-- Marked as SECURITY DEFINER so anonymous mobile scans can increment the click counter
-- without granting blanket table UPDATE privileges to public users.
create or replace function increment_clicks(row_id uuid)
returns void as $$
begin
  update qrcodes
  set clicks = clicks + 1
  where id = row_id;
end;
$$ language plpgsql security definer;

-- Revoke default public permissions and grant explicitly to anon & authenticated roles
revoke all on function increment_clicks(uuid) from public;
grant execute on function increment_clicks(uuid) to anon;
grant execute on function increment_clicks(uuid) to authenticated;
