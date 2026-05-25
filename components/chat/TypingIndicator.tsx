'use client'

import React from 'react'

interface TypingIndicatorProps {
  typingUsers: Record<string, boolean>
}

export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  const activeTyping = Object.keys(typingUsers).filter(user => typingUsers[user])

  if (activeTyping.length === 0) return null

  const text = activeTyping.length === 1
    ? `${activeTyping[0]} is drafting a message...`
    : `${activeTyping.slice(0, 2).join(', ')}${activeTyping.length > 2 ? ' and others' : ''} are drafting...`

  return (
    <div className="flex items-center gap-2 px-5 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 select-none animate-fadeIn">
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="italic">{text}</span>
    </div>
  )
}
export type { TypingIndicatorProps }
