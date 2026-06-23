-- Migration Part 31: GitHub API cache table
CREATE TABLE IF NOT EXISTS public.github_cache (
  key TEXT PRIMARY KEY,
  data JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.github_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access to github cache
CREATE POLICY "Allow public read access to github cache"
  ON public.github_cache
  FOR SELECT
  USING (true);

-- Allow inserts and updates by all (or rather service role / client routes)
CREATE POLICY "Allow all access to github cache"
  ON public.github_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable Realtime for github_cache
ALTER PUBLICATION supabase_realtime ADD TABLE public.github_cache;
