'use client'

import React, { useState, useCallback, useRef } from 'react'
import { CornerUpLeft, Reply } from 'lucide-react'
import { ChatMessage, ChatReaction } from '@/types'
import ImageMessage from './ImageMessage'
import VideoMessage from './VideoMessage'
import PDFMessage from './PDFMessage'
import StickerMessage from './StickerMessage'
import UploadProgress from './UploadProgress'
import MessageActionSheet from './MessageActionSheet'
import ReactionPicker from './ReactionPicker'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'

// Emoji quick-access for hover bar
const EMOJI_PICKER = ['👍', '❤️', '🔥', '😂', '😮', '✨']

// Maps avatar ID to gradient + initials
const AVATAR_MAP: Record<string, { gradient: string; symbol: string }> = {
  'avatar-cyber-ghost': { gradient: 'from-indigo-400 to-purple-500', symbol: 'CM' },
  'avatar-neon-pulse': { gradient: 'from-purple-400 to-pink-500', symbol: 'SL' },
  'avatar-alpha-wing': { gradient: 'from-emerald-400 to-teal-500', symbol: 'MM' },
  'avatar-solar-flare': { gradient: 'from-orange-300 to-rose-400', symbol: 'WP' },
  'avatar-void-runner': { gradient: 'from-rose-400 to-pink-500', symbol: 'CB' },
  'avatar-shadow-blade': { gradient: 'from-slate-400 to-indigo-500', symbol: 'MS' },
}

interface MessageBubbleProps {
  message: ChatMessage
  activeUserId: string
  onReact: (messageId: string, emoji: string) => void
  onReply: (message: ChatMessage) => void
  onDelete: (messageId: string) => void
  onDeleteForMe: (messageId: string) => void
  onClearChat: () => void
}

export default function MessageBubble({
  message,
  activeUserId,
  onReact,
  onReply,
  onDelete,
  onDeleteForMe,
  onClearChat,
}: MessageBubbleProps) {
  const isSelf = message.sender_id === activeUserId
  const isDeleted = message.type === 'deleted'

  // ——— State ———
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [reactionPickerPos, setReactionPickerPos] = useState<{ x: number; y: number } | null>(null)

  // Long-press detection refs
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const longPressTriggered = useRef(false)

  // Format timestamp
  const timeStr = message.created_at
    ? new Date(message.created_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : ''

  // Avatar
  const avatarId = message.profiles?.avatar || 'avatar-cyber-ghost'
  const avatar = AVATAR_MAP[avatarId] || AVATAR_MAP['avatar-cyber-ghost']

  // Reaction counts
  const reactionCounts: Record<string, { count: number; hasReacted: boolean }> = {}
  if (message.reactions) {
    message.reactions.forEach((r) => {
      if (!reactionCounts[r.emoji]) {
        reactionCounts[r.emoji] = { count: 0, hasReacted: false }
      }
      reactionCounts[r.emoji].count += 1
      if (r.user_id === activeUserId) {
        reactionCounts[r.emoji].hasReacted = true
      }
    })
  }

  // ——— Swipe gesture (mobile reply) ———
  const { handlers: swipeHandlers, swipeOffset, isSwiping } = useSwipeGesture({
    threshold: 60,
    onSwipeRight: () => !isDeleted && onReply(message),
    enabled: !isDeleted,
  })

  // ——— Long-press handlers (mobile action sheet) ———
  const handleTouchStartLongPress = useCallback(() => {
    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      if (navigator.vibrate) navigator.vibrate(20)
      setShowActionSheet(true)
    }, 500)
  }, [])

  const handleTouchEndLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  // ——— Desktop right-click reaction picker ———
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    if (isDeleted) return
    setReactionPickerPos({ x: e.clientX, y: e.clientY })
  }, [isDeleted])

  // ——— Copy text ———
  const handleCopy = useCallback(() => {
    if (message.message) {
      navigator.clipboard.writeText(message.message).catch(() => {})
    }
  }, [message.message])

  // ——— Keyboard interactions ———
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isDeleted) return
    if (e.key === 'Enter' && !e.shiftKey) {
      onReply(message)
      e.preventDefault()
    }
  }, [isDeleted, message, onReply])

  // ——— Message content renderer ———
  const renderMessageContent = () => {
    // Deleted state
    if (isDeleted) {
      return (
        <div className="p-3.5 rounded-2xl text-xs italic text-gray-400 dark:text-gray-500 bg-black/[0.03] dark:bg-white/3 border border-black/5 dark:border-white/5">
          message deleted
        </div>
      )
    }

    const isUploading = message.sending && message.uploadProgress !== undefined
    if (isUploading) {
      return <UploadProgress progress={message.uploadProgress || 0} fileName={message.file_name} />
    }

    const hasCaption =
      message.message &&
      message.message !== message.file_name &&
      message.type !== 'sticker' &&
      message.type !== 'text'

    return (
      <div className="space-y-2">
        {message.type === 'image' && message.file_url && (
          <ImageMessage src={message.file_url} fileName={message.file_name || undefined} isSending={message.sending} />
        )}
        {message.type === 'video' && message.file_url && (
          <VideoMessage src={message.file_url} fileName={message.file_name || undefined} />
        )}
        {message.type === 'pdf' && message.file_url && (
          <PDFMessage src={message.file_url} fileName={message.file_name || undefined} fileSize={message.file_size} />
        )}
        {message.type === 'sticker' && message.file_url && (
          <StickerMessage src={message.file_url} />
        )}
        {(message.type === 'text' || hasCaption) && (
          <div
            className={`p-3.5 rounded-2xl text-xs leading-relaxed border ${
              isSelf
                ? `bg-gradient-to-br from-indigo-50/70 to-violet-50/40 text-gray-800 border-black/5 dark:from-violet-500/10 dark:via-pink-500/5 dark:to-transparent dark:text-white dark:border-white/5 rounded-tr-none ${
                    message.replied_message ? 'rounded-tl-none' : ''
                  }`
                : `bg-gray-100/70 text-gray-800 border-black/5 dark:bg-[#1c1f26]/50 dark:text-gray-300 dark:border-white/3 rounded-tl-none ${
                    message.replied_message ? 'rounded-tr-none' : ''
                  }`
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{message.message}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Main bubble wrapper */}
      <article
        data-message-id={message.id}
        role="article"
        aria-label={`${message.profiles?.username || 'user'} at ${timeStr}: ${isDeleted ? 'message deleted' : (message.message || message.file_name || 'media')}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onContextMenu={handleContextMenu}
        className={`flex gap-3 group relative max-w-[75%] animate-fadeIn focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 rounded-xl ${
          isSelf ? 'ml-auto flex-row-reverse' : ''
        }`}
        // Long-press (touch) for mobile action sheet
        onTouchStart={() => {
          swipeHandlers.onTouchStart // also handled by swipe hook
          handleTouchStartLongPress()
        }}
        onTouchEnd={() => {
          handleTouchEndLongPress()
        }}
        onTouchMove={handleTouchEndLongPress} // cancel long-press if finger moves
      >
        {/* Swipe-to-reply wrapper — handles the horizontal translation */}
        <div
          className="flex gap-3 relative w-full"
          style={{
            transform: swipeOffset > 0 ? `translateX(${swipeOffset}px)` : undefined,
            transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
          {...swipeHandlers}
        >
          {/* Swipe reply indicator (appears behind bubble while swiping) */}
          {swipeOffset > 8 && (
            <div
              className={`absolute ${isSelf ? 'right-full mr-2' : 'left-full ml-2'} top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/15 text-indigo-500 pointer-events-none`}
              style={{ opacity: Math.min(swipeOffset / 60, 1) }}
            >
              <Reply className="h-4 w-4" />
            </div>
          )}

          {/* 1. Avatar */}
          <div
            className={`h-8 w-8 rounded-lg bg-gradient-to-br ${avatar.gradient} flex items-center justify-center text-xs font-semibold text-black shadow-md shrink-0 select-none`}
            aria-hidden="true"
          >
            {avatar.symbol}
          </div>

          {/* 2. Content column */}
          <div className="space-y-1 min-w-0 flex-1">

            {/* Sender + time */}
            <div className={`flex items-baseline gap-2 select-none lowercase ${isSelf ? 'justify-end' : ''}`}>
              <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                {message.profiles?.username || 'explorer'}
              </span>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">{timeStr}</span>
              {message.sending && (
                <span className="text-[9px] text-gray-400 font-medium animate-pulse">sending...</span>
              )}
              {message.error && (
                <span className="text-[9px] text-rose-400 font-medium">failed to send</span>
              )}
            </div>

            {/* Bubble container */}
            <div className="relative">

              {/* Replied-to preview */}
              {message.replied_message && (
                <div className="text-[10px] bg-black/5 dark:bg-white/2 border border-black/5 dark:border-white/5 border-b-0 rounded-t-2xl p-2 pb-1.5 flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-medium select-none truncate">
                  <CornerUpLeft className="h-3 w-3 text-violet-400 shrink-0" aria-hidden="true" />
                  <span className="font-semibold text-gray-700 dark:text-gray-200 shrink-0">
                    {message.replied_message.sender_name}:
                  </span>
                  <span className="truncate italic">"{message.replied_message.message}"</span>
                </div>
              )}

              {/* Message content */}
              {renderMessageContent()}

              {/* Desktop hover action bar — visible on group-hover */}
              {!isDeleted && (
                <div
                  className={`absolute top-[-30px] hidden group-hover:flex items-center gap-1 bg-[#fefdfb] dark:bg-[#1c1f26] border border-black/8 dark:border-white/10 rounded-xl px-1.5 py-1 z-20 shadow-lg transition-all duration-150 ${
                    isSelf ? 'left-0' : 'right-0'
                  }`}
                  role="toolbar"
                  aria-label="Message actions"
                >
                  {/* Quick emoji */}
                  <div className="flex items-center border-r border-black/5 dark:border-white/5 pr-1.5 mr-0.5">
                    {EMOJI_PICKER.map((emoji) => {
                      const alreadyReacted = reactionCounts[emoji]?.hasReacted
                      return (
                        <button
                          key={emoji}
                          onClick={() => onReact(message.id, emoji)}
                          className={`p-1 hover:scale-125 focus:scale-125 transition-transform text-[13px] cursor-pointer rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                            alreadyReacted ? 'bg-violet-500/10 rounded' : ''
                          }`}
                          aria-label={`React with ${emoji}${alreadyReacted ? ' (remove)' : ''}`}
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      )
                    })}
                  </div>

                  {/* Reply button — prominent, hover-bar */}
                  <button
                    onClick={() => onReply(message)}
                    className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/8 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    title="Reply (Enter)"
                    aria-label="Reply to this message"
                  >
                    <Reply className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Reaction pills */}
            {message.reactions && message.reactions.length > 0 && (
              <div className={`flex flex-wrap gap-1 mt-1 select-none ${isSelf ? 'justify-end' : ''}`}>
                {Object.entries(reactionCounts).map(([emoji, data]) => (
                  <button
                    key={emoji}
                    onClick={() => onReact(message.id, emoji)}
                    className={`flex items-center gap-1 py-0.5 px-2 rounded-lg border text-[10px] font-medium transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                      data.hasReacted
                        ? 'bg-violet-500/10 border-violet-400/30 text-violet-600 dark:text-violet-300'
                        : 'bg-black/[0.03] dark:bg-white/3 border-black/5 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/8'
                    }`}
                    aria-label={`${emoji} reaction, ${data.count} ${data.count === 1 ? 'person' : 'people'}${data.hasReacted ? ', remove your reaction' : ', add reaction'}`}
                    aria-pressed={data.hasReacted}
                  >
                    <span aria-hidden="true">{emoji}</span>
                    <span>{data.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Mobile Action Sheet */}
      {showActionSheet && (
        <MessageActionSheet
          message={message}
          isSelf={isSelf}
          onClose={() => setShowActionSheet(false)}
          onReply={() => onReply(message)}
          onReact={(emoji) => onReact(message.id, emoji)}
          onCopy={handleCopy}
          onDeleteForMe={() => onDeleteForMe(message.id)}
          onDeleteForEveryone={() => onDelete(message.id)}
          onClearChat={onClearChat}
        />
      )}

      {/* Desktop Reaction Picker (right-click) */}
      {reactionPickerPos && (
        <ReactionPicker
          x={reactionPickerPos.x}
          y={reactionPickerPos.y}
          message={message}
          isSelf={isSelf}
          onReact={(emoji) => onReact(message.id, emoji)}
          onReply={() => onReply(message)}
          onCopy={handleCopy}
          onDeleteForMe={() => onDeleteForMe(message.id)}
          onDeleteForEveryone={() => onDelete(message.id)}
          onClearChat={onClearChat}
          onClose={() => setReactionPickerPos(null)}
        />
      )}
    </>
  )
}

export type { MessageBubbleProps }
