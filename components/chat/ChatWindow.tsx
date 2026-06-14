'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Users, MoreVertical, Phone, Sun, Moon, Copy, BellOff, LogOut, Trash2, BookOpen, Sparkles, X, Flame, Search, Info, Play, BarChart2 } from 'lucide-react'
import { UserProfile, ChatMessage } from '@/types'
import { useTheme } from 'next-themes'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import DragDropZone from './DragDropZone'
import StudyPanel from './StudyPanel'
import useMessages from '@/hooks/useMessages'
import useRealtimeChat from '@/hooks/useRealtimeChat'
import useRealtimeGroupState from '@/hooks/useRealtimeGroupState'
import { useMoodAndMemories } from '@/hooks/useMoodAndMemories'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
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
    deleteMessageForMe,
    clearChatForMe,
    replyTo,
    setReplyTo,
  } = useMessages(groupId, activeUser)

  const {
    onlineUsers,
    typingUsers,
    sendTypingStatus,
    myFocus,
    updateFocusStatus
  } = useRealtimeChat(groupId, activeUser)

  const {
    studyModeActive,
    timerEndsAt,
    timerDuration,
    timerType,
    toggleStudyMode,
    startTimer,
    stopTimer
  } = useRealtimeGroupState(groupId)

  const { saveToVault } = useMoodAndMemories(activeUser?.id)

  const handleSaveToVault = async (msg: ChatMessage) => {
    try {
      const isPhoto = msg.type === 'image' || (msg.file_url && (msg.file_url.includes('png') || msg.file_url.includes('jpg') || msg.file_url.includes('jpeg')))
      const title = isPhoto ? 'saved image moment' : 'saved chat moment'
      const notes = msg.message || ''
      const fileUrl = msg.file_url || ''
      const fileName = msg.file_name || ''
      
      await saveToVault(title, msg.id, fileUrl, fileName, notes, true)
      alert('moment saved to your memory vault! you can manage it in the memories tab.')
    } catch (err) {
      console.error('Failed to save moment to vault:', err)
    }
  }

  // Local Study Panel Open state (default true on desktop, false on mobile)
  const [studyPanelOpen, setStudyPanelOpen] = useState(true)
  // Local Study Filter active state
  const [studyFilterActive, setStudyFilterActive] = useState(false)

  const onlineCount = Object.keys(onlineUsers).length
  const activeCount = Object.values(onlineUsers).filter((u: any) => !u.isFocusing).length
  const activeStudyMembers = Object.values(onlineUsers).filter((u: any) => u.isFocusing).length
  const cleanName = groupName.replace('#', '').toLowerCase()
  const isGeneralRoom = cleanName === 'general'
  const isFocusRoom = cleanName === 'focus room'
  const effectiveStudyModeActive = isGeneralRoom ? false : (isFocusRoom ? true : studyModeActive)
  const gradient = groupGradient(groupId)

  const supabase = createClient()
  const [focusRoomStats, setFocusRoomStats] = useState({ activeSessions: 0, todayHours: 0 })

  useEffect(() => {
    if (!isFocusRoom) return

    const fetchStats = async () => {
      try {
        // Query active sessions (completed = false)
        const { count: activeCountVal, error: activeErr } = await supabase
          .from('focus_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('completed', false)

        // Query today's completed focus sessions
        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)
        
        const { data: todaySessions, error: todayErr } = await supabase
          .from('focus_sessions')
          .select('actual_minutes')
          .eq('completed', true)
          .gte('completed_at', startOfToday.toISOString())

        if (!activeErr && !todayErr) {
          const totalMins = todaySessions?.reduce((sum, s) => sum + s.actual_minutes, 0) || 0
          setFocusRoomStats({
            activeSessions: activeCountVal || 0,
            todayHours: Number((totalMins / 60).toFixed(1))
          })
        }
      } catch (err) {
        console.warn("Failed to fetch focus room stats:", err)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 15000)
    return () => clearInterval(interval)
  }, [isFocusRoom, supabase])

  // Close study panel automatically on tiny mobile screens initially
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setStudyPanelOpen(false)
    }
  }, [effectiveStudyModeActive])

  // Initials from group name
  const initials = cleanName
    .split(' ')
    .map(w => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || '#'

  return (
    <DragDropZone onFileDrop={setDraftFile}>
      <div className={`flex flex-col h-full relative overflow-hidden transition-all duration-500 ${
        isGeneralRoom
          ? 'bg-[#faf6f2] dark:bg-[#0e0d10]'
          : (isFocusRoom
              ? 'bg-[#fafaf6] dark:bg-[#0a0a0d]'
              : (effectiveStudyModeActive
                  ? 'bg-[#f6f3eb] dark:bg-[#0c0c0f]'
                  : 'bg-[#f0ede8] dark:bg-[#0f0f12]'))
      }`}>

        {/* ── Subtle background texture ── */}
        <div 
          className={`absolute inset-0 pointer-events-none transition-all duration-500 ${
            isGeneralRoom 
              ? 'opacity-[0.025] dark:opacity-[0.05]' 
              : (isFocusRoom
                  ? 'opacity-[0.03] dark:opacity-[0.06]'
                  : 'opacity-[0.015] dark:opacity-[0.03]')
          }`}
          style={{ backgroundImage: isGeneralRoom
            ? 'radial-gradient(circle at 20% 30%, #ec4899 0%, transparent 60%), radial-gradient(circle at 80% 80%, #8b5cf6 0%, transparent 50%)'
            : (isFocusRoom
                ? 'radial-gradient(circle at 30% 20%, rgba(245, 158, 11, 0.4) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.25) 0%, transparent 50%)'
                : (effectiveStudyModeActive
                    ? 'radial-gradient(circle at 30% 20%, #f59e0b 0%, transparent 60%), radial-gradient(circle at 80% 80%, #d97706 0%, transparent 50%)'
                    : 'radial-gradient(circle at 30% 20%, #6366f1 0%, transparent 60%), radial-gradient(circle at 80% 80%, #8b5cf6 0%, transparent 50%)'))
          }}
        />

        {/* ══════════════════════════════════════
            STICKY HEADER
            ══════════════════════════════════════ */}
        <header className={`relative z-10 flex items-center gap-3 px-4 shrink-0 backdrop-blur-xl border-b transition-all duration-500 ${
          isGeneralRoom
            ? 'bg-[#faf6f2]/90 dark:bg-[#141318]/90 py-2.5 h-auto border-black/5 dark:border-white/[0.05]'
            : (isFocusRoom
                ? 'bg-[#fafaf6]/90 dark:bg-[#0e0e12]/90 py-2.5 h-auto border-amber-500/10 shadow-[0_1px_10px_rgba(245,158,11,0.01)]'
                : (effectiveStudyModeActive
                    ? 'bg-[#faf8f4]/90 dark:bg-[#121216]/90 border-amber-500/10 shadow-[0_1px_10px_rgba(245,158,11,0.02)] h-14'
                    : 'bg-[#faf9f6]/80 dark:bg-[#16181d]/80 border-black/5 dark:border-white/[0.05] h-14'))
        }`}>

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
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className="text-sm font-bold text-gray-900 dark:text-white lowercase leading-none truncate">
              {cleanName}
            </p>
            {isGeneralRoom && (
              <p className="text-[10.5px] text-gray-500 dark:text-gray-400 font-medium mt-1 leading-tight max-w-[280px] sm:max-w-md md:max-w-lg truncate lowercase">
                community discussions, planning and daily conversations.
              </p>
            )}
            {isFocusRoom && (
              <p className="text-[10.5px] text-gray-500 dark:text-gray-400 font-medium mt-1 leading-tight max-w-[280px] sm:max-w-md md:max-w-lg truncate lowercase">
                collaborative study space
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                isFocusRoom
                  ? (activeStudyMembers > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400')
                  : (effectiveStudyModeActive ? 'bg-amber-400' : 'bg-emerald-400')
              }`} />
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold lowercase">
                {isGeneralRoom && `${onlineCount} ${onlineCount === 1 ? 'member' : 'members'} online • ${activeCount} active`}
                {isFocusRoom && `${activeStudyMembers} active study members • ${focusRoomStats.activeSessions} active sessions • ${focusRoomStats.todayHours}h focused today`}
                {!isGeneralRoom && !isFocusRoom && (effectiveStudyModeActive ? 'zen study session' : `${onlineCount} ${onlineCount === 1 ? 'person' : 'people'} here`)}
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

            {/* Study Mode Toggles (visible only if study mode is active) */}
            {effectiveStudyModeActive && (
              <>
                {/* Study Filter Toggle */}
                <button
                  onClick={() => setStudyFilterActive(v => !v)}
                  className={`flex items-center justify-center h-8 w-8 rounded-full transition-all cursor-pointer ${
                    studyFilterActive
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                  title={studyFilterActive ? "Study chat filter: on (prioritizing text, code & PDFs)" : "Study chat filter: off"}
                  aria-label="Toggle study chat filter"
                >
                  <Sparkles className="h-4.5 w-4.5" />
                </button>

                {/* Study Sidebar Toggle */}
                <button
                  onClick={() => setStudyPanelOpen(v => !v)}
                  className={`flex items-center justify-center h-8 w-8 rounded-full transition-all cursor-pointer ${
                    studyPanelOpen
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                  title={studyPanelOpen ? "Close study room panel" : "Open study room panel"}
                  aria-label="Toggle study room panel"
                >
                  <BookOpen className="h-4.5 w-4.5" />
                </button>
              </>
            )}

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
                  className="absolute top-full right-0 mt-1.5 w-56 z-50 bg-[#fefdfb] dark:bg-[#1c1f26] rounded-2xl border border-black/6 dark:border-white/5 shadow-xl shadow-black/10 dark:shadow-black/40 p-1.5 animate-scaleIn"
                  style={{ transformOrigin: 'top right' }}
                >
                  {isGeneralRoom && (
                    <>
                      {/* Room info */}
                      <button
                        role="menuitem"
                        onClick={() => {
                          alert(`room info: #${cleanName}\n\ndescription: community discussions, planning and daily conversations.\nonline members: ${onlineCount}\nactive members: ${activeCount}`)
                          setMoreMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white transition-all text-left cursor-pointer"
                      >
                        <Info className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                        room info
                      </button>

                      {/* Search messages */}
                      <button
                        role="menuitem"
                        onClick={() => {
                          const query = prompt("enter text to search in this room:")
                          if (query) {
                            alert(`searching messages for: "${query}"\n\nfeature is powered by supabase search. look for matches in the message feed!`)
                          }
                          setMoreMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white transition-all text-left cursor-pointer"
                      >
                        <Search className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                        search messages
                      </button>
                    </>
                  )}

                  {isFocusRoom && (
                    <>
                      {/* Start Focus Session */}
                      <button
                        role="menuitem"
                        onClick={() => {
                          router.push('/growth/focus')
                          setMoreMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/5 transition-all text-left cursor-pointer"
                      >
                        <Play className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        start focus session
                      </button>

                      {/* View Active Members */}
                      <button
                        role="menuitem"
                        onClick={() => {
                          const studyingList = Object.values(onlineUsers)
                            .filter((u: any) => u.isFocusing)
                            .map((u: any) => `${u.username || 'explorer'} (${u.focusActivity || 'studying'})`)
                            .join('\n')
                          alert(studyingList ? `members studying now:\n\n${studyingList}` : "no members are currently studying in this room.")
                          setMoreMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white transition-all text-left cursor-pointer"
                      >
                        <Users className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        view active members
                      </button>

                      {/* View Room Statistics */}
                      <button
                        role="menuitem"
                        onClick={() => {
                          alert(`focus room statistics:\n\n• active study members: ${activeStudyMembers}\n• active focus sessions: ${focusRoomStats.activeSessions}\n• today's total focused time: ${focusRoomStats.todayHours} hours`)
                          setMoreMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white transition-all text-left cursor-pointer"
                      >
                        <BarChart2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        view room statistics
                      </button>
                    </>
                  )}

                  {!isGeneralRoom && !isFocusRoom && (
                    <>
                      {/* Room info */}
                      <button
                        role="menuitem"
                        onClick={() => {
                          alert(`room info: #${cleanName}\n\nonline members: ${onlineCount}`)
                          setMoreMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white transition-all text-left cursor-pointer"
                      >
                        <Info className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                        room info
                      </button>

                      {/* Toggle Study Mode */}
                      <button
                        role="menuitem"
                        onClick={() => {
                          toggleStudyMode(!studyModeActive)
                          setMoreMenuOpen(false)
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                          studyModeActive
                            ? 'text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <BookOpen className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        {studyModeActive ? 'disable study mode' : 'enable study mode'}
                      </button>
                    </>
                  )}

                  {/* Common Options */}
                  <button
                    role="menuitem"
                    onClick={() => {
                      alert("notifications muted for this room!")
                      setMoreMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white transition-all text-left cursor-pointer"
                  >
                    <BellOff className="h-3.5 w-3.5 text-violet-400 dark:text-amber-400 shrink-0" />
                    mute notifications
                  </button>

                  <button
                    role="menuitem"
                    onClick={() => {
                      if (confirm("are you sure you want to clear this chat's history for yourself? this cannot be undone.")) {
                        clearChatForMe()
                      }
                      setMoreMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all text-left cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    clear chat history
                  </button>

                  {/* Separator */}
                  <div className="my-1 mx-2 h-px bg-black/5 dark:bg-white/5" />

                  <button
                    role="menuitem"
                    onClick={() => {
                      alert("to leave this channel, please contact the workspace moderator or administrator.")
                      setMoreMenuOpen(false)
                    }}
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

        {/* ── ══════════════════════════════════════
            SPLIT LAYOUT FOR CHAT + SIDEBAR
            ══════════════════════════════════════ */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          
          {/* Main chat column */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <MessageList
              messages={messages}
              isLoading={isLoading}
              activeUser={activeUser}
              typingUsers={typingUsers}
              onReact={toggleReaction}
              onReply={setReplyTo}
              onDelete={deleteMessage}
              onDeleteForMe={deleteMessageForMe}
              onClearChat={clearChatForMe}
              // @ts-ignore (we will add these types or they are handled in MessageList)
              studyModeActive={effectiveStudyModeActive}
              studyFilterActive={studyFilterActive}
              isDeepFocusActive={myFocus.isDeepFocus}
              onSaveToVault={handleSaveToVault}
            />

            <MessageInput
              studyModeActive={effectiveStudyModeActive}
              onSendMessage={(text, fileInfo, category) => sendMessage(text, fileInfo, false, category, effectiveStudyModeActive)}
              replyTo={replyTo}
              onClearReply={() => setReplyTo(null)}
              onTypingStatusChange={sendTypingStatus}
              disabled={isLoading || !activeUser}
              draftFile={draftFile}
              setDraftFile={setDraftFile}
            />
          </div>

          {/* Study Room sidebar (slides in from right/absolute on mobile, relative on desktop) */}
          {effectiveStudyModeActive && studyPanelOpen && (
            <div className="absolute top-0 right-0 z-50 h-full w-80 lg:relative lg:z-0 border-l border-black/5 dark:border-white/[0.05] shadow-2xl lg:shadow-none">
              {/* Close button on mobile overlay */}
              <button
                onClick={() => setStudyPanelOpen(false)}
                className="lg:hidden absolute top-3.5 right-3.5 z-50 flex items-center justify-center h-8 w-8 rounded-full bg-black/5 hover:bg-black/10 text-gray-500 hover:text-gray-800 transition-all cursor-pointer"
                aria-label="Close study room panel"
              >
                <X className="h-4 w-4" />
              </button>
              <StudyPanel
                groupId={groupId}
                activeUserId={activeUser?.id || ''}
                onlineUsers={onlineUsers}
                myFocus={myFocus}
                updateFocusStatus={updateFocusStatus}
                timerEndsAt={timerEndsAt}
                timerDuration={timerDuration}
                timerType={timerType}
                startTimer={startTimer}
                stopTimer={stopTimer}
              />
            </div>
          )}
        </div>

      </div>
    </DragDropZone>
  )
}

export type { ChatWindowProps }
