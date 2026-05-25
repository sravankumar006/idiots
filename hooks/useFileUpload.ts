'use client'

import { useState, useRef } from 'react'
import { uploadFile } from '@/lib/storage/uploadFile'
import { getPublicUrl } from '@/lib/storage/getFileUrl'

export interface UploadResult {
  url: string
  path: string
}

/**
 * Reusable hook to handle uploading a single file with reactive state updates,
 * progress tracking, and cancellation support.
 */
export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  // XMLHttpRequest reference to support aborting the upload request
  const xhrRef = useRef<XMLHttpRequest | null>(null)

  const upload = async (
    file: File,
    bucket: string = 'chat-media'
  ): Promise<UploadResult | null> => {
    setIsUploading(true)
    setProgress(0)
    setError(null)

    // Generate unique storage name using UUID to prevent collisions
    const fileId = crypto.randomUUID()
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const path = `${fileId}_${safeFileName}`

    try {
      const storagePath = await uploadFile({
        bucket,
        path,
        file,
        onProgress: (percent) => setProgress(percent),
        xhrRef
      })

      const url = getPublicUrl(bucket, storagePath)
      setIsUploading(false)
      return { url, path: storagePath }
    } catch (err: any) {
      const message = err.message || 'File upload failed.'
      if (message !== 'Upload aborted by user.') {
        setError(message)
      }
      setIsUploading(false)
      return null
    }
  }

  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort()
      setIsUploading(false)
      setProgress(0)
      setError('Upload cancelled.')
    }
  }

  return {
    upload,
    cancelUpload,
    isUploading,
    progress,
    error,
    setError
  }
}
export default useFileUpload
