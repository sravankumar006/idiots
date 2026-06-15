-- Migration Part 21 — Notification Deep Linking
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

alter table public.notifications
add column if not exists entity_type text,
add column if not exists entity_id text,
add column if not exists room_id text,
add column if not exists message_id text;
