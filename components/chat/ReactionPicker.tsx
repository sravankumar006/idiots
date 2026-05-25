import React, { useEffect, useRef } from 'react'
import { Reply, Copy, Trash2, Eye, Brain } from 'lucide-react'
import { ChatMessage } from '@/types'
import ActionButton from './MessageActions'

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
  onClearChat: () => void
  onClose: () => void
  onShowSeenBy?: () => void
  onSaveToVault?: () => void
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
  onClearChat,
  onClose,
  onShowSeenBy,
  onSaveToVault,
}: ReactionPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Smart positioning — ensure popup stays within viewport
  const POPUP_W = 240
  const POPUP_H = 260
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
            <ActionButton
              icon={<Reply className="h-4 w-4 text-indigo-500 shrink-0" />}
              label="reply"
              onClick={() => handleAction(onReply)}
            />
          )}

          {/* Copy Text */}
          {hasText && !isDeleted && (
            <ActionButton
              icon={<Copy className="h-4 w-4 text-gray-400 shrink-0" />}
              label="copy text"
              onClick={() => handleAction(onCopy)}
            />
          )}

          {/* Who Saw This? */}
          {!isDeleted && onShowSeenBy && (
            <ActionButton
              icon={<Eye className="h-4 w-4 text-violet-500 shrink-0" />}
              label="who saw this?"
              onClick={() => handleAction(onShowSeenBy)}
            />
          )}

          {/* Save to Memory Vault */}
          {!isDeleted && onSaveToVault && (
            <ActionButton
              icon={<Brain className="h-4 w-4 text-amber-500 shrink-0" />}
              label="save to vault"
              onClick={() => handleAction(onSaveToVault)}
            />
          )}

          {/* Delete for Me (always present) */}
          {!isDeleted && (
            <ActionButton
              icon={<Trash2 className="h-4 w-4 text-rose-500 shrink-0" />}
              label="delete for me"
              onClick={() => handleAction(onDeleteForMe)}
              destructive
            />
          )}

          {/* Delete for Everyone (own messages only) */}
          {isSelf && !isDeleted && (
            <ActionButton
              icon={<Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />}
              label="delete for everyone"
              onClick={() => handleAction(onDeleteForEveryone)}
              destructive
            />
          )}

          {/* Clear Chat */}
          <ActionButton
            icon={<Trash2 className="h-4 w-4 text-rose-500 shrink-0" />}
            label="clear chat"
            onClick={() => handleAction(() => {
              if (confirm("are you sure you want to clear this chat's history for yourself? this cannot be undone.")) {
                onClearChat()
              }
            })}
            destructive
          />

        </div>

      </div>
    </div>
  )
}

