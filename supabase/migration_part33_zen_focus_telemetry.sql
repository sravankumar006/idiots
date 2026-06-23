-- Migration Part 33 — Zen Focus Telemetry
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- Add columns to public.focus_sessions to support Zen Focus telemetry
alter table public.focus_sessions 
add column if not exists title text,
add column if not exists category text,
add column if not exists started_at timestamp with time zone,
add column if not exists ended_at timestamp with time zone,
add column if not exists pause_count integer default 0 not null;
