-- Migration Part 24 — Allow Message Deletion for Everyone (RLS Update Policy)
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

-- Create update policy for the messages table to allow users to update (soft-delete) their own messages
drop policy if exists "Allow users to update their own messages" on public.messages;
create policy "Allow users to update their own messages" on public.messages
  for update using (auth.uid() = sender_id);
