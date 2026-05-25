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
}: MessageListProps) {
  const { containerRef, handleScroll, adjustScroll } = useAutoScroll()

  useEffect(() => {
    adjustScroll()
  }, [messages, typingUsers, adjustScroll])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center space-y-3 select-none" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" aria-hidden="true" />
        <span className="text-[10px] font-medium text-gray-500 lowercase tracking-wider">
          loading messages...
        </span>
      </div>
    )
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-center select-none text-xs text-gray-500">
        <span className="font-medium">no messages yet.</span>
        <span className="text-[10px] tracking-wide mt-1 text-gray-400">be the first to say something! 👋</span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 min-h-0 overflow-y-auto p-5 space-y-6 scrollbar-thin scroll-smooth"
      role="log"
      aria-label="Message history"
      aria-live="polite"
      aria-relevant="additions"
    >
      <div className="space-y-5">
        {messages.map((msg) => (
          <MemoizedBubble
            key={msg.id}
            message={msg}
            activeUserId={activeUser?.id || ''}
            onReact={onReact}
            onReply={onReply}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Typing indicators */}
      <TypingIndicator typingUsers={typingUsers} />
    </div>
  )
}

export type { MessageListProps }
