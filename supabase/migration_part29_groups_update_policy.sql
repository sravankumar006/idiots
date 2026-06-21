-- Migration Part 29 — Groups Update Policy
-- Paste this script directly in the Supabase Dashboard -> SQL Editor and run it.

create policy "Allow group updates for authenticated users"
on public.groups for update
using (auth.uid() is not null)
with check (auth.uid() is not null);
