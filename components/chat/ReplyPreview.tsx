'use client'

import React from 'react'
import { X, CornerUpLeft } from 'lucide-react'
import { ChatMessage } from '@/types'

interface ReplyPreviewProps {
  message: ChatMessage | null
  onClose: () => void
}

export default function ReplyPreview({ message, onClose }: ReplyPreviewProps) {
  if (!message) return null

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-violet-500/[0.03] dark:bg-violet-500/5 border-t border-x border-black/5 dark:border-white/5 rounded-t-xl text-[11px] select-none animate-slideDown">
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 min-w-0">
        <CornerUpLeft className="h-3.5 w-3.5 text-violet-400 shrink-0" />
        <span className="font-bold text-gray-700 dark:text-white shrink-0">
          Replying to {message.profiles?.username || 'User'}:
        </span>
        <span className="truncate text-gray-500 dark:text-gray-400 font-medium italic">
          "{message.message}"
        </span>
      </div>
      <button 
        onClick={onClose}
        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white transition-all cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
export type { ReplyPreviewProps }
