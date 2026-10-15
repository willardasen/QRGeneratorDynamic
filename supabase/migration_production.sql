-- =========================================================================
-- QRFlow Production Security & Performance Hardening Migration
-- Run this in your Supabase SQL Editor prior to deploying to production.
-- =========================================================================

-- 1. Ensure Table Structure & Extensions
create extension if not exists "uuid-ossp";

create table if not exists qrcodes (
  id              uuid          default uuid_generate_v4() primary key,
  slug            text          not null unique,
  destination_url text          null,          -- NULL = unassigned / pending door-to-door activation
  clicks          integer       default 0 not null,
  created_at      timestamptz   default now() not null
);

-- Ensure is_printed column exists for door-to-door printed tracking
alter table qrcodes
add column if not exists is_printed boolean default false not null;

-- 2. Performance Indexes
-- Essential for low-latency Edge redirect lookups
create index if not exists idx_qrcodes_slug on qrcodes (slug);

-- Speeds up admin dashboard queries ordering by creation date
create index if not exists idx_qrcodes_created_at on qrcodes (created_at desc);

-- Speeds up queries filtering by printed status
create index if not exists idx_qrcodes_is_printed on qrcodes (is_printed);

-- 3. Row Level Security (RLS) Hardening
alter table qrcodes enable row level security;

-- Drop insecure open-access mutation policies from prototype
drop policy if exists "Allow anonymous insert" on qrcodes;
drop policy if exists "Allow anonymous update" on qrcodes;
drop policy if exists "Allow anonymous delete" on qrcodes;

-- Public SELECT policy: needed so Edge function can look up slugs using the anon key
drop policy if exists "Allow anonymous read" on qrcodes;
create policy "Allow anonymous read" on qrcodes
  for select
  using (true);

-- Mutations (INSERT, UPDATE, DELETE) are restricted:
-- Only backend operations using the SUPABASE_SERVICE_ROLE_KEY will bypass RLS.
-- Direct client requests with the public anon key will be rejected.

-- 4. Atomic Click Increment Function
-- Marked as SECURITY DEFINER so that it can be invoked safely from the Edge
-- redirect route using the public anon key without granting broad table UPDATE rights.
create or replace function increment_clicks(row_id uuid)
returns void as $$
begin
  update qrcodes
  set clicks = clicks + 1
  where id = row_id;
end;
$$ language plpgsql security definer;

-- Grant execution permission to the anon role for Edge redirects
grant execute on function increment_clicks(uuid) to anon;
grant execute on function increment_clicks(uuid) to authenticated;
