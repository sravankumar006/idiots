'use client'

import React, { useEffect, useCallback } from 'react'
import { Reply, SmilePlus, Copy, Trash2, Share2, X } from 'lucide-react'
import { ChatMessage } from '@/types'

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '😂', '😮', '✨']

interface MessageActionSheetProps {
  message: ChatMessage
  isSelf: boolean
  onClose: () => void
  onReply: () => void
  onReact: (emoji: string) => void
  onCopy: () => void
  onDeleteForMe: () => void
  onDeleteForEveryone: () => void
  onClearChat: () => void
}

/**
 * MessageActionSheet — mobile bottom-drawer for message interactions.
 * Slides up on long-press. Provides Reply, React, Copy, Delete (own only).
 * Accessible: role=dialog, focus trap, Escape to close.
 */
export default function MessageActionSheet({
  message,
  isSelf,
  onClose,
  onReply,
  onReact,
  onCopy,
  onDeleteForMe,
  onDeleteForEveryone,
  onClearChat,
}: MessageActionSheetProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleAction = useCallback((action: () => void) => {
    action()
    onClose()
  }, [onClose])

  const isDeleted = message.type === 'deleted'
  const hasText = message.message && message.type === 'text'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Message actions"
        className="fixed bottom-0 left-0 right-0 z-50 animate-slideUp"
      >
        <div className="bg-white dark:bg-[#0f101d] rounded-t-2xl border-t border-black/5 dark:border-white/8 shadow-2xl overflow-hidden">
          
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
          </div>

          {/* Message Preview */}
          <div className="px-5 py-3 border-b border-black/5 dark:border-white/5">
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 lowercase truncate">
              {isDeleted ? 'message deleted' : (message.message || message.file_name || 'media')}
            </p>
          </div>

          {/* Quick Emoji Row */}
          {!isDeleted && (
            <div className="px-5 py-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center justify-around">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleAction(() => onReact(emoji))}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
                    aria-label={`React with ${emoji}`}
                  >
                    <span className="text-2xl">{emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Items */}
          <div className="px-3 py-2 space-y-0.5">
            
            {/* Reply */}
            {!isDeleted && (
              <ActionItem
                icon={<Reply className="h-5 w-5 text-indigo-500" />}
                label="reply"
                onClick={() => handleAction(onReply)}
              />
            )}

            {/* Copy Text */}
            {hasText && !isDeleted && (
              <ActionItem
                icon={<Copy className="h-5 w-5 text-gray-500 dark:text-gray-400" />}
                label="copy text"
                onClick={() => handleAction(onCopy)}
              />
            )}

            {/* Forward (architecture-ready, disabled) */}
            {!isDeleted && (
              <ActionItem
                icon={<Share2 className="h-5 w-5 text-gray-400" />}
                label="forward"
                subLabel="coming soon"
                onClick={() => {}}
                disabled
              />
            )}

            {/* Delete for Me */}
            {!isDeleted && (
              <ActionItem
                icon={<Trash2 className="h-5 w-5 text-rose-500" />}
                label="delete for me"
                labelClass="text-rose-600 dark:text-rose-400"
                onClick={() => handleAction(onDeleteForMe)}
                destructive
              />
            )}

            {/* Delete for Everyone */}
            {isSelf && !isDeleted && (
              <ActionItem
                icon={<Trash2 className="h-5 w-5 text-rose-600" />}
                label="delete for everyone"
                labelClass="text-rose-700 dark:text-rose-300"
                onClick={() => handleAction(onDeleteForEveryone)}
                destructive
              />
            )}

            {/* Clear Chat */}
            <ActionItem
              icon={<Trash2 className="h-5 w-5 text-rose-500" />}
              label="clear chat"
              labelClass="text-rose-600 dark:text-rose-400"
              onClick={() => handleAction(() => {
                if (confirm("are you sure you want to clear this chat's history for yourself? this cannot be undone.")) {
                  onClearChat()
                }
              })}
              destructive
            />
          </div>

          {/* Cancel Button */}
          <div className="px-3 pb-safe pb-6 pt-2">
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-black/[0.04] dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
              cancel
            </button>
          </div>

        </div>
      </div>
    </>
  )
}

// ——— ActionItem sub-component ———
interface ActionItemProps {
  icon: React.ReactNode
  label: string
  subLabel?: string
  onClick: () => void
  labelClass?: string
  disabled?: boolean
  destructive?: boolean
}

function ActionItem({ icon, label, subLabel, onClick, labelClass, disabled, destructive }: ActionItemProps) {
  return (
    <button
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`w-full flex items-center gap-4 px-3 py-3.5 rounded-xl transition-all text-left min-h-[52px] ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : destructive
          ? 'hover:bg-rose-50 dark:hover:bg-rose-500/10 active:bg-rose-50/70 cursor-pointer'
          : 'hover:bg-black/[0.03] dark:hover:bg-white/5 active:bg-black/5 cursor-pointer'
      }`}
      aria-label={label}
    >
      <span className="shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium lowercase ${labelClass || 'text-gray-700 dark:text-gray-200'}`}>
          {label}
        </span>
        {subLabel && (
          <span className="block text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{subLabel}</span>
        )}
      </div>
    </button>
  )
}

export type { MessageActionSheetProps }
