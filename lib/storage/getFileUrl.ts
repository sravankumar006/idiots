import { createClient } from '@/lib/supabase/client'

/**
 * Generates the public HTTP URL for an object inside a Supabase Storage bucket.
 * @param bucket The name of the storage bucket
 * @param path The relative storage path of the file
 */
export function getPublicUrl(bucket: string, path: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
