'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { CornerUpLeft, Reply, Image as ImageIcon, FileText } from 'lucide-react'
import { ChatMessage, ChatReaction } from '@/types'
import ImageMessage from './ImageMessage'
import VideoMessage from './VideoMessage'
import PDFMessage from './PDFMessage'
import StickerMessage from './StickerMessage'
import UploadProgress from './UploadProgress'
import MessageActionSheet from './MessageActionSheet'
import ReactionPicker from './ReactionPicker'
import ReadReceiptsModal from './ReadReceiptsModal'
import AIPDFDownload from './AIPDFDownload'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'

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

// Hardcoded AI profile avatar
const AI_AVATAR = { gradient: 'from-indigo-500 to-violet-600', symbol: '🤖' }

type MessageStatus = 'offline' | 'sent' | 'seen'

interface MessageBubbleProps {
  message: ChatMessage
  activeUserId: string
  groupPosition?: 'single' | 'first' | 'middle' | 'last'
  isLatestMessage?: boolean
  groupMemberIds?: string[]
  onReact: (messageId: string, emoji: string) => void
  onReply: (message: ChatMessage) => void
  onDelete: (messageId: string) => void
  onDeleteForMe: (messageId: string) => void
  onClearChat: () => void
  studyModeActive?: boolean
  studyFilterActive?: boolean
}

export default function MessageBubble({
  message,
  activeUserId,
  groupPosition = 'single',
  isLatestMessage = false,
  groupMemberIds = [],
  onReact,
  onReply,
  onDelete,
  onDeleteForMe,
  onClearChat,
  studyModeActive = false,
  studyFilterActive = false,
}: MessageBubbleProps) {
  const isAiMessage = message.type === 'ai'
  // AI messages always render on the left (not self)
  const isSelf = isAiMessage ? false : message.sender_id === activeUserId
  const isDeleted = message.type === 'deleted'

  // ——— State ———
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [reactionPickerPos, setReactionPickerPos] = useState<{ x: number; y: number } | null>(null)
  const [isSeenModalOpen, setIsSeenModalOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [mediaCollapsed, setMediaCollapsed] = useState(studyFilterActive)

  // Sync media collapse with filter active status
  useEffect(() => {
    setMediaCollapsed(studyFilterActive)
  }, [studyFilterActive])

  // Track online status
  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

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
  const avatarId = isAiMessage ? 'avatar-cyber-ghost' : (message.profiles?.avatar || 'avatar-cyber-ghost')
  const avatar = isAiMessage ? AI_AVATAR : (AVATAR_MAP[avatarId] || AVATAR_MAP['avatar-cyber-ghost'])

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

  // ——— Traffic Light Status ———
  const computeStatus = (): MessageStatus => {
    if (message.error || message.sending || !isOnline) return 'offline'
    const seenList = message.message_seen || []
    // Other group members (excluding the sender)
    const otherMembers = groupMemberIds.filter((id) => id !== message.sender_id)
    if (otherMembers.length === 0) return 'sent'
    const seenUserIds = new Set(seenList.map((s) => s.user_id))
    const allSeen = otherMembers.every((id) => seenUserIds.has(id))
    return allSeen ? 'seen' : 'sent'
  }

  const messageStatus = isSelf && isLatestMessage && !isDeleted ? computeStatus() : null

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

  // ——— Show seen by ———
  const handleShowSeenBy = useCallback(() => {
    setIsSeenModalOpen(true)
  }, [])

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
        {/* Images with click-to-expand study filter */}
        {message.type === 'image' && message.file_url && (
          mediaCollapsed ? (
            <button
              onClick={() => setMediaCollapsed(false)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] border border-black/5 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide transition-all duration-200 cursor-pointer w-fit select-none lowercase"
            >
              <ImageIcon className="h-4 w-4 text-amber-500" />
              <span>image hidden by study filter — click to view</span>
            </button>
          ) : (
            <ImageMessage src={message.file_url} fileName={message.file_name || undefined} isSending={message.sending} />
          )
        )}
        
        {/* Videos with click-to-expand study filter */}
        {message.type === 'video' && message.file_url && (
          mediaCollapsed ? (
            <button
              onClick={() => setMediaCollapsed(false)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] border border-black/5 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide transition-all duration-200 cursor-pointer w-fit select-none lowercase"
            >
              <ImageIcon className="h-4 w-4 text-amber-500" />
              <span>video hidden by study filter — click to view</span>
            </button>
          ) : (
            <VideoMessage src={message.file_url} fileName={message.file_name || undefined} />
          )
        )}
        
        {/* PDFs are never collapsed since they are prioritised */}
        {message.type === 'pdf' && message.file_url && (
          <PDFMessage src={message.file_url} fileName={message.file_name || undefined} fileSize={message.file_size} />
        )}
        
        {/* Stickers with click-to-expand study filter */}
        {message.type === 'sticker' && message.file_url && (
          mediaCollapsed ? (
            <button
              onClick={() => setMediaCollapsed(false)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] border border-black/5 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide transition-all duration-200 cursor-pointer w-fit select-none lowercase"
            >
              <ImageIcon className="h-4 w-4 text-amber-500" />
              <span>sticker hidden by study filter — click to view</span>
            </button>
          ) : (
            <StickerMessage src={message.file_url} />
          )
        )}
        {(message.type === 'text' || message.type === 'ai' || hasCaption) && (
          <div
            className={`p-3.5 text-[13px] leading-relaxed border transition-all duration-500 ${
              message.type === 'ai'
                ? studyModeActive
                  ? 'bg-[#18181f] text-gray-300 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.02)] dark:bg-[#121216] dark:border-amber-500/10'
                  : 'bg-[#1c1f26] text-gray-200 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)] dark:bg-[#16181d] dark:border-indigo-400/20'
                : isSelf
                ? studyModeActive
                  ? 'bg-[#d97706] text-white border-transparent dark:bg-[#b45309]'
                  : `bg-[#6366f1] text-white border-black/5 dark:bg-[#5b5fcf] dark:text-white dark:border-white/5`
                : studyModeActive
                ? 'bg-white text-gray-800 border-amber-500/10 dark:bg-[#16181d] dark:text-gray-200 dark:border-white/5'
                : `bg-white text-gray-800 border-black/5 dark:bg-[#1c1f26] dark:text-gray-200 dark:border-white/5 shadow-sm`
            } ${
              // Dynamic border radius for grouping
              isSelf
                ? groupPosition === 'first' ? 'rounded-2xl rounded-tr-md'
                  : groupPosition === 'middle' ? 'rounded-2xl rounded-tr-md rounded-br-md'
                  : groupPosition === 'last' ? 'rounded-2xl rounded-br-md'
                  : 'rounded-2xl'
                : groupPosition === 'first' ? 'rounded-2xl rounded-tl-md'
                  : groupPosition === 'middle' ? 'rounded-2xl rounded-tl-md rounded-bl-md'
                  : groupPosition === 'last' ? 'rounded-2xl rounded-bl-md'
                  : 'rounded-2xl'
            } ${
              message.replied_message ? (isSelf ? 'rounded-tr-none' : 'rounded-tl-none') : ''
            }`}
          >
            {message.type === 'ai' ? (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-code:text-indigo-300 break-words">
                {/* AI mode badge — shows context being analyzed */}
                {(message.aiMode === 'image-analyze') && (
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-500/80 mb-2 select-none not-prose">
                    <ImageIcon className="h-3 w-3" />
                    <span>analyzing image from chat</span>
                  </div>
                )}
                {(message.aiMode === 'pdf-analyze') && (
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-500/80 mb-2 select-none not-prose">
                    <FileText className="h-3 w-3" />
                    <span>reading pdf from chat</span>
                  </div>
                )}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.message}
                </ReactMarkdown>
                {/* PDF generation — show download button */}
                {message.aiMode === 'pdf-generate' && !message.sending && message.message && (
                  <AIPDFDownload
                    content={message.message}
                    filename={`ai-document-${new Date().toISOString().slice(0, 10)}`}
                  />
                )}
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words">{message.message}</p>
            )}
          </div>
        )}
      </div>
    )
  }

  // ——— Traffic Light Capsule ———
  const TrafficLight = () => {
    if (!messageStatus) return null

    const colors: Record<MessageStatus, { dot: string; label: string; ring: string }> = {
      offline: { dot: 'bg-rose-500', label: 'offline / pending', ring: 'ring-rose-500/20' },
      sent:    { dot: 'bg-amber-400', label: 'sent',             ring: 'ring-amber-400/20' },
      seen:    { dot: 'bg-emerald-400', label: 'seen by all',    ring: 'ring-emerald-400/20' },
    }
    const c = colors[messageStatus]

    return (
      <div
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-black/5 dark:border-white/8 bg-black/[0.03] dark:bg-white/[0.04] select-none cursor-default ring-2 ${c.ring} transition-all duration-500`}
        title={c.label}
        aria-label={`Message status: ${c.label}`}
      >
        {/* Three dots like traffic lights — always visible but only active dot is bright */}
        <span className={`h-2 w-2 rounded-full transition-all duration-500 ${messageStatus === 'offline' ? c.dot + ' shadow-[0_0_6px_1px_rgba(239,68,68,0.6)]' : 'bg-gray-200 dark:bg-white/10'}`} />
        <span className={`h-2 w-2 rounded-full transition-all duration-500 ${messageStatus === 'sent' ? c.dot + ' shadow-[0_0_6px_1px_rgba(251,191,36,0.6)]' : 'bg-gray-200 dark:bg-white/10'}`} />
        <span className={`h-2 w-2 rounded-full transition-all duration-500 ${messageStatus === 'seen' ? c.dot + ' shadow-[0_0_6px_1px_rgba(52,211,153,0.6)]' : 'bg-gray-200 dark:bg-white/10'}`} />
      </div>
    )
  }

  return (
    <>
      {/* Main bubble wrapper */}
      <article
        data-message-id={message.id}
        role="article"
        aria-label={`${isAiMessage ? 'idiot ai' : (message.profiles?.username || 'user')} at ${timeStr}: ${isDeleted ? 'message deleted' : (message.message || message.file_name || 'media')}`}
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

          {/* 1. Avatar (Only show on last or single message) */}
          <div className="w-8 shrink-0 flex items-end">
            {(groupPosition === 'last' || groupPosition === 'single') && !isSelf ? (
              isAiMessage ? (
                <div
                  className={`h-8 w-8 rounded-full bg-gradient-to-br ${avatar.gradient} flex items-center justify-center text-[10px] font-semibold text-white shadow-sm shrink-0 select-none`}
                  aria-hidden="true"
                >
                  {avatar.symbol}
                </div>
              ) : (
                <Link
                  href={`/dashboard?userId=${message.sender_id}`}
                  className={`h-8 w-8 rounded-full bg-gradient-to-br ${avatar.gradient} flex items-center justify-center text-[10px] font-semibold text-white shadow-sm shrink-0 select-none hover:opacity-80 transition-opacity cursor-pointer`}
                  aria-hidden="true"
                >
                  {avatar.symbol}
                </Link>
              )
            ) : null}
          </div>

          {/* 2. Content column */}
          <div className="space-y-1 min-w-0 flex-1">

            {/* Sender + time (Only show on first or single message, or if self and need to show sending status) */}
            {((groupPosition === 'first' || groupPosition === 'single') || isSelf) && (
              <div className={`flex items-center gap-2 select-none lowercase ${isSelf ? 'justify-end' : ''}`}>
                {!isSelf && (
                  isAiMessage ? (
                    <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                      idiot ai
                    </span>
                  ) : (
                    <Link
                      href={`/dashboard?userId=${message.sender_id}`}
                      className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 hover:text-violet-500 hover:underline cursor-pointer"
                    >
                      {message.profiles?.username || 'explorer'}
                    </Link>
                  )
                )}
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{timeStr}</span>
                {message.sending && (
                  <span className="text-[10px] text-gray-400 font-medium animate-pulse">sending...</span>
                )}
                {message.error && (
                  <span className="text-[10px] text-rose-400 font-medium">failed to send</span>
                )}
              </div>
            )}

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

              {/* Quick actions hover bar (desktop only) */}
              {!isDeleted && !message.sending && (
                <div
                  className={`hidden md:flex opacity-0 group-hover:opacity-100 items-center gap-1 absolute z-30 -top-5.5 ${
                    isSelf ? 'right-4' : 'left-4'
                  } bg-[#faf9f6]/95 dark:bg-[#16181d]/95 backdrop-blur border border-black/6 dark:border-white/5 rounded-xl shadow-lg shadow-black/5 p-1 ${
                    studyModeActive ? 'border-amber-500/10 shadow-none duration-100' : 'transition-all duration-150 transform translate-y-1 group-hover:translate-y-0'
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
                          className={`p-1 ${
                            studyModeActive ? 'scale-100' : 'hover:scale-125 focus:scale-125 transition-transform'
                          } text-[13px] cursor-pointer rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
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

            {/* Traffic Light — only on latest message sent by self */}
            {messageStatus && (
              <div className={`flex mt-1 ${isSelf ? 'justify-end' : 'justify-start'}`}>
                <TrafficLight />
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
          onShowSeenBy={isSelf ? handleShowSeenBy : undefined}
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
          onShowSeenBy={isSelf ? handleShowSeenBy : undefined}
        />
      )}

      {/* Read Receipts Modal */}
      <ReadReceiptsModal
        isOpen={isSeenModalOpen}
        onClose={() => setIsSeenModalOpen(false)}
        message={message}
        activeUserId={activeUserId}
      />
    </>
  )
}

export type { MessageBubbleProps }
