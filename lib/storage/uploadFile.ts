import { createClient } from '@/lib/supabase/client'

export interface UploadFileOptions {
  bucket: string
  path: string
  file: File
  onProgress?: (progress: number) => void
  xhrRef?: React.MutableRefObject<XMLHttpRequest | null>
}

/**
 * Uploads a file to Supabase Storage using XMLHttpRequest to track progress.
 * @returns The storage path of the uploaded file on success
 */
export async function uploadFile({
  bucket,
  path,
  file,
  onProgress,
  xhrRef
}: UploadFileOptions): Promise<string> {
  const supabase = createClient()
  
  // 1. Retrieve the user's active session token for storage policy authorization
  const { data: { session } } = await supabase.auth.getSession()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials are missing. Check your environment variables.')
  }

  // Construct authorization header using active session token or fallback to anon key
  const token = session?.access_token || supabaseAnonKey

  // Format upload endpoint. Path segments should be URL encoded properly.
  const pathSegments = path.split('/').map(segment => encodeURIComponent(segment)).join('/')
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${pathSegments}`

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    if (xhrRef) {
      xhrRef.current = xhr
    }

    xhr.open('POST', uploadUrl, true)

    // Set Supabase Headers
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('apikey', supabaseAnonKey)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')

    // Track upload progress percentage
    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          onProgress(percentComplete)
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(path)
      } else {
        try {
          const res = JSON.parse(xhr.responseText)
          reject(new Error(res.message || res.error || `Upload failed with status ${xhr.status}`))
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      }
    }

    xhr.onerror = () => {
      reject(new Error('Network error during file upload.'))
    }

    xhr.onabort = () => {
      reject(new Error('Upload aborted by user.'))
    }

    // Send raw file binary body
    xhr.send(file)
  })
}
