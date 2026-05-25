'use client'

import React, { useEffect, memo } from 'react'
import { Loader2 } from 'lucide-react'
import { ChatMessage, UserProfile } from '@/types'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import useAutoScroll from '@/hooks/useAutoScroll'

interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
  activeUser: UserProfile | null
  typingUsers: Record<string, boolean>
  onReact: (messageId: string, emoji: string) => void
  onReply: (message: ChatMessage) => void
  onDelete: (messageId: string) => void
  onDeleteForMe: (messageId: string) => void
}

// Memoized bubble — prevents re-renders when only typing indicator changes
const MemoizedBubble = memo(MessageBubble, (prev, next) => {
  return (
    prev.message === next.message &&
    prev.message.reactions === next.message.reactions &&
    prev.message.sending === next.message.sending &&
    prev.message.error === next.message.error &&
    prev.message.uploadProgress === next.message.uploadProgress &&
    prev.activeUserId === next.activeUserId
  )
})
MemoizedBubble.displayName = 'MemoizedMessageBubble'

export default function MessageList({
  messages,
  isLoading,
  activeUser,
  typingUsers,
  onReact,
  onReply,
  onDelete,
  onDeleteForMe,
}: MessageListProps) {
  const { containerRef, handleScroll, adjustScroll } = useAutoScroll()

  useEffect(() => {
    adjustScroll()
  }, [messages, typingUsers, adjustScroll])

  // Skeleton Loading state
  if (isLoading) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5 select-none animate-pulse" role="status" aria-live="polite">
        {[1, 2, 3, 4].map((i) => {
          const isLeft = i % 2 !== 0
          return (
            <div key={i} className={`flex gap-3 max-w-[70%] ${isLeft ? '' : 'ml-auto flex-row-reverse'}`}>
              <div className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-white/5 shrink-0" />
              <div className="space-y-1 flex-1">
                <div className={`h-2.5 w-20 bg-gray-200 dark:bg-white/5 rounded ${isLeft ? '' : 'ml-auto'}`} />
                <div className={`h-12 bg-gray-200 dark:bg-white/5 rounded-2xl ${isLeft ? 'rounded-tl-none' : 'rounded-tr-none'}`} />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-center select-none text-xs text-gray-500">
        <span className="font-medium">this space is quiet for now.</span>
        <span className="text-[10px] tracking-wide mt-1 text-gray-400">start the conversation! 👋</span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 min-h-0 overflow-y-auto p-5 space-y-3 scrollbar-thin scroll-smooth"
      role="log"
      aria-label="Message history"
      aria-live="polite"
      aria-relevant="additions"
    >
      <div className="space-y-3">
        {messages.map((msg) => (
          <MemoizedBubble
            key={msg.id}
            message={msg}
            activeUserId={activeUser?.id || ''}
            onReact={onReact}
            onReply={onReply}
            onDelete={onDelete}
            onDeleteForMe={onDeleteForMe}
          />
        ))}
      </div>

      {/* Typing indicators */}
      <TypingIndicator typingUsers={typingUsers} />
    </div>
  )
}

export type { MessageListProps }
