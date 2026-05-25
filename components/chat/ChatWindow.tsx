'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Users, MoreVertical, Phone, Sun, Moon, Copy, BellOff, LogOut } from 'lucide-react'
import { UserProfile } from '@/types'
import { useTheme } from 'next-themes'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import DragDropZone from './DragDropZone'
import useMessages from '@/hooks/useMessages'
import useRealtimeChat from '@/hooks/useRealtimeChat'

// Avatar palette — same as workspace (kept local to avoid coupling)
const AVATAR_MAP: Record<string, { gradient: string; symbol: string }> = {
  'avatar-cyber-ghost':  { gradient: 'from-indigo-400 to-purple-500',  symbol: 'CM' },
  'avatar-neon-pulse':   { gradient: 'from-purple-400 to-pink-500',    symbol: 'SL' },
  'avatar-alpha-wing':   { gradient: 'from-emerald-400 to-teal-500',   symbol: 'MM' },
  'avatar-solar-flare':  { gradient: 'from-orange-300 to-rose-400',    symbol: 'WP' },
  'avatar-void-runner':  { gradient: 'from-rose-400 to-pink-500',      symbol: 'CB' },
  'avatar-shadow-blade': { gradient: 'from-slate-400 to-indigo-500',   symbol: 'MS' },
}

// Deterministic group color from group ID
const GROUP_GRADIENTS = [
  'from-violet-400 to-purple-500',
  'from-indigo-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
]
function groupGradient(id: string) {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return GROUP_GRADIENTS[hash % GROUP_GRADIENTS.length]
}

interface ChatWindowProps {
  groupId: string
  groupName: string
  activeUser: UserProfile | null
  onBack?: () => void
}

export default function ChatWindow({ groupId, groupName, activeUser, onBack }: ChatWindowProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const [draftFile, setDraftFile] = useState<File | null>(null)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!moreMenuOpen) return
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false)
      }
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handleOutside), 10)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handleOutside) }
  }, [moreMenuOpen])

  const {
    messages,
    isLoading,
    sendMessage,
    toggleReaction,
    deleteMessage,
    replyTo,
    setReplyTo,
  } = useMessages(groupId, activeUser)

  const { onlineUsers, typingUsers, sendTypingStatus } = useRealtimeChat(groupId, activeUser)

  const onlineCount = Object.keys(onlineUsers).length
  const cleanName = groupName.replace('#', '').toLowerCase()
  const gradient = groupGradient(groupId)

  // Initials from group name
  const initials = cleanName
    .split(' ')
    .map(w => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || '#'

  return (
    <DragDropZone onFileDrop={setDraftFile}>
      <div className="flex flex-col h-full bg-[#f0ede8] dark:bg-[#0f0f12] relative overflow-hidden">

        {/* ── Subtle background texture ── */}
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #6366f1 0%, transparent 60%), radial-gradient(circle at 80% 80%, #8b5cf6 0%, transparent 50%)' }}
        />

        {/* ══════════════════════════════════════
            STICKY HEADER
            ══════════════════════════════════════ */}
        <header className="relative z-10 flex items-center gap-3 px-4 h-14 shrink-0 bg-[#faf9f6]/80 dark:bg-[#16181d]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/[0.05]">

          {/* Back arrow — mobile only */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden flex items-center justify-center h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer shrink-0"
              aria-label="Back to channels"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>
          )}

          {/* Group avatar */}
          <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0 select-none`}>
            {initials}
          </div>

          {/* Name + status */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white lowercase leading-none truncate">
              {cleanName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                {onlineCount} {onlineCount === 1 ? 'person' : 'people'} here
              </span>
            </div>
          </div>

          {/* Right-side actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Call — architecture-ready placeholder */}
            <button
              className="hidden sm:flex items-center justify-center h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-all cursor-pointer"
              title="Voice call (coming soon)"
              aria-label="Voice call"
            >
              <Phone className="h-4 w-4" />
            </button>

            {/* Members count pill */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.05] border border-black/5 dark:border-white/5">
              <Users className="h-3 w-3 text-violet-500" />
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{onlineCount}</span>
            </div>

            {/* Theme toggle (in header since global topbar is hidden) */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all cursor-pointer"
                title="Toggle theme"
                aria-label="Toggle light/dark mode"
              >
                {theme === 'dark'
                  ? <Sun className="h-4 w-4 text-amber-400" />
                  : <Moon className="h-4 w-4 text-indigo-500" />
                }
              </button>
            )}

            {/* More options dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMoreMenuOpen(v => !v)}
                className={`flex items-center justify-center h-8 w-8 rounded-full transition-all cursor-pointer ${
                  moreMenuOpen
                    ? 'bg-black/8 dark:bg-white/8 text-gray-800 dark:text-white'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                title="More options"
                aria-label="More options"
                aria-expanded={moreMenuOpen}
                aria-haspopup="menu"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {moreMenuOpen && (
                <div
                  role="menu"
                  className="absolute top-full right-0 mt-1.5 w-52 z-50 bg-[#fefdfb] dark:bg-[#1c1f26] rounded-2xl border border-black/6 dark:border-white/5 shadow-xl shadow-black/10 dark:shadow-black/40 p-1.5 animate-scaleIn"
                  style={{ transformOrigin: 'top right' }}
                >
                  {/* Room info */}
                  <button
                    role="menuitem"
                    onClick={() => {
                      navigator.clipboard.writeText(cleanName)
                      setMoreMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white transition-all text-left cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                    copy room name
                  </button>

                  <button
                    role="menuitem"
                    onClick={() => setMoreMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white transition-all text-left cursor-pointer"
                  >
                    <BellOff className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                    mute notifications
                  </button>

                  {/* Separator */}
                  <div className="my-1 mx-2 h-px bg-black/5 dark:bg-white/5" />

                  <button
                    role="menuitem"
                    onClick={() => setMoreMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all text-left cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5 shrink-0" />
                    leave room
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ══════════════════════════════════════
            MESSAGE HISTORY (fills all space)
            ══════════════════════════════════════ */}
        <MessageList
          messages={messages}
          isLoading={isLoading}
          activeUser={activeUser}
          typingUsers={typingUsers}
          onReact={toggleReaction}
          onReply={setReplyTo}
          onDelete={deleteMessage}
        />

        {/* ══════════════════════════════════════
            MESSAGE INPUT
            ══════════════════════════════════════ */}
        <MessageInput
          onSendMessage={sendMessage}
          replyTo={replyTo}
          onClearReply={() => setReplyTo(null)}
          onTypingStatusChange={sendTypingStatus}
          disabled={isLoading || !activeUser}
          draftFile={draftFile}
          setDraftFile={setDraftFile}
        />

      </div>
    </DragDropZone>
  )
}

export type { ChatWindowProps }
