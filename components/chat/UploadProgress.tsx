'use client'

import React from 'react'
import { X } from 'lucide-react'

interface UploadProgressProps {
  progress: number
  fileName?: string | null
  onCancel?: () => void
}

export default function UploadProgress({
  progress,
  fileName,
  onCancel
}: UploadProgressProps) {
  return (
    <div className="p-3 rounded-xl border border-white/5 bg-[#0a0b15]/60 backdrop-blur-md max-w-[240px] w-full select-none space-y-2.5 shadow-2xl animate-fadeIn">
      
      {/* File Label & Progress % */}
      <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 lowercase tracking-wide">
        <span className="truncate max-w-[70%]" title={fileName || 'uploading...'}>
          {fileName || 'uploading...'}
        </span>
        <span className="text-violet-400 font-mono">{progress}%</span>
      </div>

      {/* Progress Track */}
      <div className="relative flex items-center">
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/2">
          <div
            className="h-full bg-gradient-to-r from-violet-500 via-pink-400 to-rose-400 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(139,92,246,0.3)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {onCancel && (
          <button
            onClick={onCancel}
            className="ml-2.5 p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer shrink-0"
            title="Cancel Upload"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

    </div>
  )
}
export type { UploadProgressProps }
