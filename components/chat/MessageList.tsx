'use client'

import React, { useEffect, memo } from 'react'
import { ChatMessage, UserProfile } from '@/types'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import useAutoScroll from '@/hooks/useAutoScroll'
import EmptyChat from './EmptyChat'
import MessageSkeleton from './MessageSkeleton'

interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
  activeUser: UserProfile | null
  typingUsers: Record<string, boolean>
  onReact: (messageId: string, emoji: string) => void
  onReply: (message: ChatMessage) => void
  onDelete: (messageId: string) => void
  onDeleteForMe: (messageId: string) => void
  onClearChat: () => void
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
  onClearChat,
}: MessageListProps) {
  const { containerRef, handleScroll, adjustScroll } = useAutoScroll()

  useEffect(() => {
    adjustScroll()
  }, [messages, typingUsers, adjustScroll])

  // Skeleton Loading state
  if (isLoading) {
    return <MessageSkeleton />
  }

  // Empty state
  if (messages.length === 0) {
    return <EmptyChat />
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
            onClearChat={onClearChat}
          />
        ))}
      </div>

      {/* Typing indicators */}
      <TypingIndicator typingUsers={typingUsers} />
    </div>
  )
}

export type { MessageListProps }

