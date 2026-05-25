'use client'

import React, { useEffect } from 'react'
import { Eye, X, Clock } from 'lucide-react'
import { ChatMessage } from '@/types'

interface ReadReceiptsModalProps {
  isOpen: boolean
  onClose: () => void
  message: ChatMessage
  activeUserId: string
}

const AVATAR_MAP: Record<string, { gradient: string; symbol: string }> = {
  'avatar-cyber-ghost': { gradient: 'from-indigo-400 to-purple-500', symbol: 'CM' },
  'avatar-neon-pulse': { gradient: 'from-purple-400 to-pink-500', symbol: 'SL' },
  'avatar-alpha-wing': { gradient: 'from-emerald-400 to-teal-500', symbol: 'MM' },
  'avatar-solar-flare': { gradient: 'from-orange-300 to-rose-400', symbol: 'WP' },
  'avatar-void-runner': { gradient: 'from-rose-400 to-pink-500', symbol: 'CB' },
  'avatar-shadow-blade': { gradient: 'from-slate-400 to-indigo-500', symbol: 'MS' },
}

export default function ReadReceiptsModal({
  isOpen,
  onClose,
  message,
  activeUserId,
}: ReadReceiptsModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Filter out system and sender seen states if any, or just display other people who saw it
  const seenUsers = message.message_seen || []
  
  // Format seen time
  const formatSeenTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md animate-fadeIn cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Read receipts list"
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="w-full max-w-sm glass-panel border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl animate-scaleIn pointer-events-auto bg-[#fefdfb]/90 dark:bg-[#0f101d]/90 flex flex-col max-h-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5 select-none">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Eye className="h-4 w-4 text-violet-400" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider">read receipts</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* List of readers */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3.5 scrollbar-thin">
            {seenUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-8 select-none">
                <Clock className="h-8 w-8 text-amber-400 animate-pulse mb-3" />
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300">sent (unseen)</h4>
                <p className="text-[10px] text-gray-500 mt-1 max-w-[200px] leading-relaxed">
                  No other members have read this message yet.
                </p>
              </div>
            ) : (
              seenUsers.map((seen) => {
                const isMe = seen.user_id === activeUserId
                const avatarId = seen.profiles?.avatar || 'avatar-cyber-ghost'
                const avatar = AVATAR_MAP[avatarId] || AVATAR_MAP['avatar-cyber-ghost']
                const username = seen.profiles?.username || 'explorer'

                return (
                  <div key={seen.id} className="flex items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${avatar.gradient} flex items-center justify-center text-[10px] font-semibold text-white select-none shadow-sm`}>
                        {avatar.symbol}
                      </div>
                      
                      <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 lowercase">
                        {username} {isMe && <span className="text-[10px] text-gray-400 font-normal">(you)</span>}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-semibold select-none">
                      <Clock className="h-3 w-3" />
                      <span>{formatSeenTime(seen.seen_at)}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </>
  )
}
