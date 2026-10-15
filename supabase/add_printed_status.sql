-- =========================================================================
-- Migration: Add is_printed column to qrcodes table
-- Run this in your Supabase SQL Editor to persist printed status in PostgreSQL
-- =========================================================================

-- 1. Add is_printed column
alter table qrcodes
add column if not exists is_printed boolean default false not null;

-- 2. Performance index for querying unassigned/printed QR codes
create index if not exists idx_qrcodes_is_printed
on qrcodes (is_printed);
