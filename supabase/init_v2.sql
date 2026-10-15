-- =====================================================
-- QRFlow V2 - Door-to-Door Sales Edition
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Drop old table if migrating from V1 (comment out if fresh install)
-- drop table if exists qrcodes;

-- Create the qrcodes table
-- NOTE: destination_url is now nullable to support "blank/unassigned" QRs
create table if not exists qrcodes (
  id              uuid          default uuid_generate_v4() primary key,
  slug            text          not null unique,
  destination_url text          null,          -- NULL = unassigned / not yet activated
  clicks          integer       default 0 not null,
  created_at      timestamptz   default now() not null
);

-- Index on slug for blazing-fast edge lookups
create index if not exists idx_qrcodes_slug on qrcodes (slug);

-- Row Level Security (open for V1 prototype — add auth in production)
alter table qrcodes enable row level security;

create policy "Allow anonymous read"   on qrcodes for select using (true);
create policy "Allow anonymous insert" on qrcodes for insert with check (true);
create policy "Allow anonymous update" on qrcodes for update using (true);
create policy "Allow anonymous delete" on qrcodes for delete using (true);

-- Atomic click counter function (called fire-and-forget from edge)
create or replace function increment_clicks(row_id uuid)
returns void as $$
begin
  update qrcodes set clicks = clicks + 1 where id = row_id;
end;
$$ language plpgsql security definer;

-- Helper: batch insert empty QRs with sequential slugs
-- This is called from the API, but kept here for reference
-- Example: select * from qrcodes where destination_url is null;
