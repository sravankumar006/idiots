'use client'

import React, { useEffect, useState } from 'react'
import { X, FileText, Film } from 'lucide-react'
import { formatSize } from '@/lib/utils/files'

interface FilePreviewProps {
  file: File | null
  onRemove: () => void
}

export default function FilePreview({
  file,
  onRemove
}: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }

    // Generate local Object URL for image drafts
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setPreviewUrl(null)
    }
  }, [file])

  if (!file) return null

  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')

  return (
    <div className="p-3 border border-black/5 dark:border-white/5 border-b-0 bg-[#fcfbf9]/90 dark:bg-[#0a0b15]/60 backdrop-blur-md rounded-t-2xl flex items-center justify-between gap-3 animate-fadeIn select-none">
      
      {/* File Detail Container */}
      <div className="flex items-center gap-3 min-w-0">
        
        {/* Media Thumbnail / Icon */}
        {isImage && previewUrl ? (
          <div className="h-10 w-10 rounded-xl border border-black/10 dark:border-white/10 overflow-hidden shrink-0 relative bg-black/5 dark:bg-black/50 shadow-md">
            <img src={previewUrl} alt="Thumbnail preview" className="h-full w-full object-cover" />
          </div>
        ) : isVideo ? (
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-inner">
            <Film className="h-5 w-5" />
          </div>
        ) : (
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0 shadow-inner">
            <FileText className="h-5 w-5" />
          </div>
        )}

        {/* Name and Size */}
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-800 dark:text-white truncate max-w-[170px] sm:max-w-[280px]">
            {file.name}
          </p>
          <p className="text-[10px] text-gray-500 font-semibold mt-0.5 lowercase tracking-wider">
            {file.type.split('/')[1] || 'Unknown'} • {formatSize(file.size)}
          </p>
        </div>

      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="p-1.5 rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-black/5 dark:hover:border-white/5 transition-all duration-200 cursor-pointer shrink-0"
        title="Remove file attachment"
      >
        <X className="h-4 w-4" />
      </button>

    </div>
  )
}
export type { FilePreviewProps }
