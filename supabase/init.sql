-- ============================================
-- Dynamic QR Code Generator - Supabase Schema
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Create the qrcodes table
create table if not exists qrcodes (
  id            uuid          default uuid_generate_v4() primary key,
  slug          text          not null unique,
  destination_url text        not null,
  clicks        integer       default 0 not null,
  created_at    timestamptz   default now() not null
);

-- Index on slug for fast lookups during redirects
create index if not exists idx_qrcodes_slug on qrcodes (slug);

-- Row Level Security (open for V1 prototype, no auth)
alter table qrcodes enable row level security;

-- Allow all operations for anonymous users (V1 prototype only)
create policy "Allow anonymous read"   on qrcodes for select using (true);
create policy "Allow anonymous insert" on qrcodes for insert with check (true);
create policy "Allow anonymous update" on qrcodes for update using (true);
create policy "Allow anonymous delete" on qrcodes for delete using (true);

-- Atomic click increment function (called via supabase.rpc from edge)
create or replace function increment_clicks(row_id uuid)
returns void as $$
begin
  update qrcodes set clicks = clicks + 1 where id = row_id;
end;
$$ language plpgsql security definer;
