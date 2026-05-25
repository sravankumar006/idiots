'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { Reply, Copy, Trash2 } from 'lucide-react'
import { ChatMessage } from '@/types'

const EMOJIS = ['👍', '❤️', '🔥', '😂', '😮', '✨']

interface ReactionPickerProps {
  x: number
  y: number
  message: ChatMessage
  isSelf: boolean
  onReact: (emoji: string) => void
  onReply: () => void
  onCopy: () => void
  onDeleteForMe: () => void
  onDeleteForEveryone: () => void
  onClose: () => void
}

/**
 * ReactionPicker — desktop floating context menu.
 * Opens at (x, y) cursor position after right-click.
 * Combines emoji reaction bar and message action shortcuts (Reply, Copy, Delete).
 */
export default function ReactionPicker({
  x,
  y,
  message,
  isSelf,
  onReact,
  onReply,
  onCopy,
  onDeleteForMe,
  onDeleteForEveryone,
  onClose,
}: ReactionPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Smart positioning — ensure popup stays within viewport
  const POPUP_W = 240
  const POPUP_H = 220
  const vpW = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vpH = typeof window !== 'undefined' ? window.innerHeight : 800

  const left = Math.min(x, vpW - POPUP_W - 16)
  const top = Math.min(y, vpH - POPUP_H - 16)

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
    }, 50)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [onClose])

  // Close on Escape globally
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const isDeleted = message.type === 'deleted'
  const hasText = message.message && message.type === 'text'

  const handleAction = (action: () => void) => {
    action()
    onClose()
  }

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Message context actions"
      className="fixed z-50 animate-scaleIn select-none"
      style={{ left, top }}
    >
      <div className="flex flex-col w-[240px] bg-[#fefdfb] dark:bg-[#1c1f26] rounded-2xl border border-black/8 dark:border-white/10 shadow-xl p-1.5 space-y-1">
        
        {/* Emoji Reaction bar (top) */}
        {!isDeleted && (
          <div className="flex items-center justify-between px-1.5 py-1 border-b border-black/5 dark:border-white/5 pb-2 mb-1">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleAction(() => onReact(emoji))}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-lg hover:bg-black/[0.05] dark:hover:bg-white/10 hover:scale-120 transition-all cursor-pointer focus:outline-none"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Action Options */}
        <div className="flex flex-col gap-0.5">
          
          {/* Reply */}
          {!isDeleted && (
            <button
              onClick={() => handleAction(onReply)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/5 hover:text-gray-950 dark:hover:text-white transition-all text-left cursor-pointer"
            >
              <Reply className="h-4 w-4 text-indigo-500 shrink-0" />
              <span>reply</span>
            </button>
          )}

          {/* Copy Text */}
          {hasText && !isDeleted && (
            <button
              onClick={() => handleAction(onCopy)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/5 hover:text-gray-950 dark:hover:text-white transition-all text-left cursor-pointer"
            >
              <Copy className="h-4 w-4 text-gray-400 shrink-0" />
              <span>copy text</span>
            </button>
          )}

          {/* Delete for Me (always present) */}
          {!isDeleted && (
            <button
              onClick={() => handleAction(onDeleteForMe)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all text-left cursor-pointer"
            >
              <Trash2 className="h-4 w-4 text-rose-500 shrink-0" />
              <span>delete for me</span>
            </button>
          )}

          {/* Delete for Everyone (own messages only) */}
          {isSelf && !isDeleted && (
            <button
              onClick={() => handleAction(onDeleteForEveryone)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all text-left cursor-pointer"
            >
              <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>delete for everyone</span>
            </button>
          )}

        </div>

      </div>
    </div>
  )
}
