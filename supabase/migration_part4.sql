-- Supabase Database & Storage Migration for Part 4 (File Upload System)
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- 1. Extend public.messages table to support file attachments
alter table public.messages add column if not exists file_url text;
alter table public.messages add column if not exists file_name text;
alter table public.messages add column if not exists file_size bigint;

-- 2. Create Storage Buckets (chat-media, avatars, documents)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  ('chat-media', 'chat-media', true, 52428800, null), -- 50MB limit, all files
  ('avatars', 'avatars', true, 5242880, array['image/png', 'image/jpeg', 'image/gif', 'image/webp']), -- 5MB limit, images only
  ('documents', 'documents', true, 104857600, null) -- 100MB limit, all documents
on conflict (id) do nothing;

-- 3. Enable RLS on storage.objects (if not already enabled)
alter table storage.objects enable row level security;

-- Drop existing policies if they exist to prevent conflicts
drop policy if exists "Allow authenticated viewing" on storage.objects;
drop policy if exists "Allow authenticated uploads" on storage.objects;
drop policy if exists "Allow owners to update own uploads" on storage.objects;
drop policy if exists "Allow owners to delete own uploads" on storage.objects;

-- 4. Create storage security policies
-- Allow authenticated users to read attachments in our buckets
create policy "Allow authenticated viewing"
on storage.objects for select
to authenticated
using (bucket_id in ('chat-media', 'avatars', 'documents'));

-- Allow authenticated users to upload files to our buckets
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('chat-media', 'avatars', 'documents')
  and (auth.uid()::text = owner_id or owner_id is null)
);

-- Allow authenticated users to update their own uploads
create policy "Allow owners to update own uploads"
on storage.objects for update
to authenticated
using (auth.uid()::text = owner_id);

-- Allow authenticated users to delete their own uploads
create policy "Allow owners to delete own uploads"
on storage.objects for delete
to authenticated
using (auth.uid()::text = owner_id);
