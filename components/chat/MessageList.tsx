'use client'

import React, { useEffect, memo, useMemo } from 'react'
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
  studyModeActive?: boolean
  studyFilterActive?: boolean
  isDeepFocusActive?: boolean
  onSaveToVault?: (message: ChatMessage) => void
}

// Memoized bubble — prevents re-renders when only typing indicator changes
const MemoizedBubble = memo(MessageBubble, (prev, next) => {
  return (
    prev.message === next.message &&
    prev.message.reactions === next.message.reactions &&
    prev.message.sending === next.message.sending &&
    prev.message.error === next.message.error &&
    prev.message.uploadProgress === next.message.uploadProgress &&
    prev.message.message_seen === next.message.message_seen &&
    prev.activeUserId === next.activeUserId &&
    prev.groupPosition === next.groupPosition &&
    prev.isLatestMessage === next.isLatestMessage &&
    prev.groupMemberIds === next.groupMemberIds &&
    // @ts-ignore
    prev.studyModeActive === next.studyModeActive &&
    // @ts-ignore
    prev.studyFilterActive === next.studyFilterActive
  )
})
MemoizedBubble.displayName = 'MemoizedMessageBubble'

function formatDateSeparator(dateString: string) {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0)) return 'Today'
  if (date.setHours(0, 0, 0, 0) === yesterday.setHours(0, 0, 0, 0)) return 'Yesterday'
  
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(dateString))
}

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
  studyModeActive = false,
  studyFilterActive = false,
  isDeepFocusActive = false,
  onSaveToVault,
}: MessageListProps) {
  const { containerRef, handleScroll, adjustScroll } = useAutoScroll()

  useEffect(() => {
    adjustScroll()
  }, [messages, typingUsers, adjustScroll])

  // Compute unique group member IDs from all message senders + active user + message_seen
  // This is a dynamic definition: anyone who has sent or seen messages is a "member"
  const groupMemberIds = useMemo(() => {
    const ids = new Set<string>()
    if (activeUser) ids.add(activeUser.id)
    for (const msg of messages) {
      if (msg.sender_id && msg.sender_id !== '00000000-0000-0000-0000-000000000000') {
        ids.add(msg.sender_id)
      }
      if (msg.message_seen) {
        for (const s of msg.message_seen) {
          ids.add(s.user_id)
        }
      }
    }
    return Array.from(ids)
  }, [messages, activeUser])

  // Compute grouping and date separators
  const enrichedMessages = useMemo(() => {
    return messages.map((msg, index) => {
      const prev = messages[index - 1]
      const next = messages[index + 1]
      const isLatestMessage = index === messages.length - 1

      const isSameSenderPrev = prev && prev.sender_id === msg.sender_id && prev.type !== 'deleted' && msg.type !== 'deleted'
      const isSameSenderNext = next && next.sender_id === msg.sender_id && next.type !== 'deleted' && msg.type !== 'deleted'

      const timeDiffPrev = prev ? new Date(msg.created_at || Date.now()).getTime() - new Date(prev.created_at || Date.now()).getTime() : Infinity
      const timeDiffNext = next ? new Date(next.created_at || Date.now()).getTime() - new Date(msg.created_at || Date.now()).getTime() : Infinity

      // Group if within 2 minutes (120000ms)
      const groupedWithPrev = isSameSenderPrev && timeDiffPrev < 120000
      const groupedWithNext = isSameSenderNext && timeDiffNext < 120000

      let groupPosition: 'single' | 'first' | 'middle' | 'last' = 'single'
      if (groupedWithPrev && groupedWithNext) groupPosition = 'middle'
      else if (groupedWithPrev) groupPosition = 'last'
      else if (groupedWithNext) groupPosition = 'first'

      // Determine if a date separator is needed before this message
      let showDateSeparator = false
      if (!prev) {
        showDateSeparator = true
      } else {
        const prevDate = new Date(prev.created_at || Date.now()).setHours(0, 0, 0, 0)
        const currDate = new Date(msg.created_at || Date.now()).setHours(0, 0, 0, 0)
        if (currDate !== prevDate) {
          showDateSeparator = true
        }
      }

      // If there's a date separator, this message breaks grouping with prev
      if (showDateSeparator && (groupPosition === 'last' || groupPosition === 'middle')) {
        groupPosition = groupPosition === 'middle' ? 'first' : 'single'
      }

      return {
        msg,
        groupPosition,
        showDateSeparator,
        isLatestMessage,
        dateString: showDateSeparator ? formatDateSeparator(msg.created_at || new Date().toISOString()) : ''
      }
    })
  }, [messages])

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
      className="flex-1 min-h-0 overflow-y-auto p-5 scrollbar-thin scroll-smooth flex flex-col"
      role="log"
      aria-label="Message history"
      aria-live="polite"
      aria-relevant="additions"
    >
      <div className="flex flex-col mt-auto">
        {enrichedMessages.map(({ msg, groupPosition, showDateSeparator, dateString, isLatestMessage }) => (
          <React.Fragment key={msg.id}>
            {showDateSeparator && (
              <div className="flex justify-center my-6">
                <span className="px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest backdrop-blur-sm">
                  {dateString}
                </span>
              </div>
            )}
            <div className={`${groupPosition === 'last' || groupPosition === 'single' ? 'mb-4' : 'mb-1'}`}>
              <MemoizedBubble
                message={msg}
                activeUserId={activeUser?.id || ''}
                groupPosition={groupPosition}
                isLatestMessage={isLatestMessage}
                groupMemberIds={groupMemberIds}
                onReact={onReact}
                onReply={onReply}
                onDelete={onDelete}
                onDeleteForMe={onDeleteForMe}
                onClearChat={onClearChat}
                // @ts-ignore
                studyModeActive={studyModeActive}
                studyFilterActive={studyFilterActive}
                onSaveToVault={onSaveToVault}
              />
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Typing indicators */}
      <div className="mt-2">
        <TypingIndicator typingUsers={typingUsers} />
      </div>
    </div>
  )
}

export type { MessageListProps }
