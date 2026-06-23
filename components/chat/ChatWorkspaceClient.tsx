'use client'

import React, { useState, useEffect } from 'react'
import {
  Settings, X, Heart, ArrowLeft,
  LayoutDashboard, Sparkles, Clock, Brain, FolderHeart,
  Hash, Sun, Moon, ChevronDown, ChevronLeft, ChevronRight,
  User, Users
} from 'lucide-react'
import { UserProfile, ChatGroup } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import ChatWindow from './ChatWindow'
import SharedAILogsRoom from './SharedAILogsRoom'
import EmptyState from './EmptyState'
import { Button } from '@/components/ui/Button'
import MobileNav from '@/components/layout/MobileNav'


// ——— Avatar palette ———
const AVATAR_MAP: Record<string, { gradient: string; symbol: string }> = {
  'avatar-cyber-ghost':  { gradient: 'from-[#3A3530] to-[#2B2824]',  symbol: 'CS' },
  'avatar-neon-pulse':   { gradient: 'from-[#8A7968] to-[#5C4F42]',    symbol: 'MB' },
  'avatar-alpha-wing':   { gradient: 'from-[#606E59] to-[#3D4739]',   symbol: 'OM' },
  'avatar-solar-flare':  { gradient: 'from-[#A87955] to-[#704F34]',    symbol: 'WA' },
  'avatar-void-runner':  { gradient: 'from-[#A85840] to-[#703626]',      symbol: 'BR' },
  'avatar-shadow-blade': { gradient: 'from-[#2A2824] to-[#1C1A17]',   symbol: 'DC' },
}

const AVATAR_OPTIONS = [
  { id: 'avatar-cyber-ghost',  name: 'Carbon Slate',     gradient: 'from-[#3A3530] to-[#2B2824]',  symbol: 'CS' },
  { id: 'avatar-neon-pulse',   name: 'Metallic Bronze',  gradient: 'from-[#8A7968] to-[#5C4F42]',    symbol: 'MB' },
  { id: 'avatar-alpha-wing',   name: 'Olive Moss',       gradient: 'from-[#606E59] to-[#3D4739]',   symbol: 'OM' },
  { id: 'avatar-solar-flare',  name: 'Warm Amber',       gradient: 'from-[#A87955] to-[#704F34]',    symbol: 'WA' },
  { id: 'avatar-void-runner',  name: 'Burnt Rust',       gradient: 'from-[#A85840] to-[#703626]',      symbol: 'BR' },
  { id: 'avatar-shadow-blade', name: 'Deep Charcoal',    gradient: 'from-[#2A2824] to-[#1C1A17]',   symbol: 'DC' },
]



interface ChatWorkspaceClientProps {
  activeUser: UserProfile | null
  initialGroups: ChatGroup[]
}

export default function ChatWorkspaceClient({ activeUser, initialGroups }: ChatWorkspaceClientProps) {
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const initialRoomId = searchParams.get('roomId')
  const highlightMessageId = searchParams.get('messageId')

  // ——— Profile state ———
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(activeUser)
  const [friends, setFriends] = useState<UserProfile[]>([])

  // ——— Modal / nav state ———
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [newUsername, setNewUsername] = useState(activeUser?.username || '')
  const [selectedAvatar, setSelectedAvatar] = useState(activeUser?.avatar || 'avatar-cyber-ghost')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // ——— Sidebar collapsed state (desktop) ───
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // ——— Mobile: 'sidebar' | 'chat' ———
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('sidebar')

  // ——— Groups / channel list ———
  const MOCK_GROUPS = [
    { id: 'default-group', group_name: 'general',    created_by: 'sys', created_at: new Date().toISOString() },
    { id: 'focus-group',   group_name: 'focus room', created_by: 'sys', created_at: new Date().toISOString() },
    { id: 'ai-logs',       group_name: 'ai logs',    created_by: 'sys', created_at: new Date().toISOString() },
  ]
  const [groups, setGroups] = useState<ChatGroup[]>(initialGroups.length > 0 ? initialGroups : MOCK_GROUPS)
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(() => {
    const defaultList = initialGroups.length > 0 ? initialGroups : MOCK_GROUPS
    const filteredList = defaultList.filter(g => g.group_name.toLowerCase() !== 'focus room')
    if (initialRoomId) {
      const match = filteredList.find(g => g.id === initialRoomId)
      if (match) return match
    }
    return filteredList[0] || null
  })

  useEffect(() => { setMounted(true) }, [])

  // Auto-seed default groups if database has none
  useEffect(() => {
    const ensureGroups = async () => {
      if (initialGroups.length === 0 && activeProfile) {
        try {
          const { data: dbGroups, error: fetchError } = await supabase
            .from('groups')
            .select('*')
            .order('group_name', { ascending: true })

          if (!fetchError && (!dbGroups || dbGroups.length === 0)) {
            const seedData = [
              { group_name: 'general', created_by: activeProfile.id },
              { group_name: 'focus room', created_by: activeProfile.id },
              { group_name: 'ai logs', created_by: activeProfile.id },
            ]
            const { data: inserted, error: insertError } = await supabase
              .from('groups')
              .insert(seedData)
              .select()

            if (!insertError && inserted && inserted.length > 0) {
              setGroups(inserted)
              setSelectedGroup(inserted[0])
            }
          } else if (dbGroups && dbGroups.length > 0) {
            setGroups(dbGroups)
            setSelectedGroup(dbGroups[0])
          }
        } catch (e) {
          console.warn("Autoseed groups check failed:", e)
        }
      }
    }
    ensureGroups()
  }, [initialGroups, activeProfile, supabase])

  // Fetch friend profiles for the online list
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const { data } = await supabase.from('profiles').select('*').limit(8)
        if (data) setFriends((data as UserProfile[]).filter(p => p.id !== activeProfile?.id))
      } catch { /* silent */ }
    }
    if (activeProfile) fetchFriends()
  }, [activeProfile, supabase])

  // Close nav dropdown on outside click
  useEffect(() => {
    if (!navOpen) return
    const close = () => setNavOpen(false)
    const t = setTimeout(() => document.addEventListener('click', close), 50)
    return () => { clearTimeout(t); document.removeEventListener('click', close) }
  }, [navOpen])

  const openProfileModal = () => {
    setNewUsername(activeProfile?.username || '')
    setSelectedAvatar(activeProfile?.avatar || 'avatar-cyber-ghost')
    setProfileModalOpen(true)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUsername.trim() || !activeProfile) return
    setIsSavingProfile(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername.trim(), avatar: selectedAvatar })
        .eq('id', activeProfile.id)
      if (error) throw error
      setActiveProfile(prev => prev ? { ...prev, username: newUsername.trim(), avatar: selectedAvatar } : null)
      setProfileModalOpen(false)
    } catch { alert('Could not save your changes.') }
    finally { setIsSavingProfile(false) }
  }

  const selectChannel = (g: ChatGroup) => {
    setSelectedGroup(g)
    setMobileView('chat')
  }

  const activeAvatar = AVATAR_MAP[activeProfile?.avatar || 'avatar-cyber-ghost'] || AVATAR_MAP['avatar-cyber-ghost']

  // ——— Sidebar inner content (shared between desktop and mobile) ———
  const SidebarContent = ({ isDesktop = false }: { isDesktop?: boolean }) => {
    const isCollapsed = isDesktop && isSidebarCollapsed
    const username = activeProfile?.username || 'me'
    const navItems = [
      { href: '/dashboard',          label: 'home',           icon: LayoutDashboard },
      { href: '/ai',                 label: 'companion',      icon: Sparkles },
      { href: '/growth/zen-focus',   label: 'zen focus',      icon: Clock },
      { href: '/focus',              label: 'study lounge',   icon: Users },
      { href: '/memories',           label: 'memories',       icon: Brain },
      { href: '/projects',           label: 'creative rooms', icon: FolderHeart },
      { href: '/settings',           label: 'settings',       icon: Settings },
    ]

    return (
      <div className="flex flex-col h-full">

        {/* ── Brand header ── */}
        <div className={`flex items-center px-4 h-14 shrink-0 border-b border-black/5 dark:border-white/5 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-violet-500 to-pink-400 flex items-center justify-center text-[11px] font-bold text-white shadow-sm select-none">
                  is
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white lowercase tracking-wide animate-fadeIn">
                  idiots space
                </span>
              </div>

              {/* Nav dropdown trigger and collapse button */}
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setNavOpen(v => !v)}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-all cursor-pointer"
                  aria-label="Navigation menu"
                  title="More pages"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${navOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDesktop && (
                  <button
                    onClick={() => setIsSidebarCollapsed(true)}
                    className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-all cursor-pointer"
                    title="Collapse Sidebar"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}

                {navOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 z-50 bg-[#fefdfb] dark:bg-[#1c1f26] rounded-xl border border-black/6 dark:border-white/5 shadow-xl p-1.5 animate-scaleIn">
                    {navItems.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/5 transition-all"
                      >
                        <Icon className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="h-8 w-8 rounded-xl bg-gradient-to-tr from-violet-500 to-pink-400 flex items-center justify-center text-[11px] font-bold text-white shadow-md hover:from-violet-600 hover:to-pink-500 group transition-all duration-300 cursor-pointer border-none"
              title="Expand Sidebar"
            >
              <span className="group-hover:hidden">is</span>
              <ChevronRight className="h-4 w-4 text-white hidden group-hover:block" />
            </button>
          )}
        </div>

        {/* ── Home Navigation Escape Hatch ── */}
        <div className={`px-3 pt-3 shrink-0 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          <Link
            href="/dashboard"
            className={`w-full flex items-center rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer group relative ${
              isCollapsed ? 'h-10 w-10 justify-center p-0' : 'px-3 py-2.5 text-left'
            } text-gray-500 dark:text-gray-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-gray-100`}
            title="Go to Home"
          >
            <LayoutDashboard className="h-4.5 w-4.5 shrink-0 text-violet-500" />
            {!isCollapsed && (
              <span className="ml-2.5 lowercase animate-fadeIn">home</span>
            )}
            
            {isCollapsed && (
              <div className="absolute left-14 scale-0 group-hover:scale-100 transition-all duration-200 z-50 py-1.5 px-3 rounded-lg bg-[#faf9f6] dark:bg-[#141520] border border-black/5 dark:border-white/10 text-xs font-bold text-gray-800 dark:text-white whitespace-nowrap shadow-lg">
                home
              </div>
            )}
          </Link>
        </div>

        {/* ── Channels list ── */}
        <div className={`px-3 pt-5 pb-2 shrink-0 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          {!isCollapsed ? (
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2 mb-2">
              Rooms
            </p>
          ) : (
            <div className="h-px w-8 bg-black/5 dark:bg-white/5 mb-4" />
          )}
          <div className="space-y-1 w-full flex flex-col items-center">
            {groups.filter(g => g.group_name.toLowerCase() !== 'focus room').map((g) => {
              const isActive = selectedGroup?.id === g.id
              const roomShortName = g.group_name.replace('#', '').toLowerCase()
              return (
                <button
                  key={g.id}
                  onClick={() => selectChannel(g)}
                  className={`w-full flex items-center rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer group relative ${
                    isCollapsed ? 'h-10 w-10 justify-center p-0' : 'px-3 py-2.5 text-left'
                  } ${
                    isActive
                      ? 'bg-violet-500/10 dark:bg-violet-500/12 text-violet-700 dark:text-violet-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                  title={isCollapsed ? roomShortName : undefined}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-violet-500" />
                  )}
                  <Hash className={`h-4 w-4 shrink-0 ${isActive ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                  {!isCollapsed && (
                    <span className="ml-2.5 truncate lowercase animate-fadeIn">{roomShortName}</span>
                  )}

                  {isCollapsed && (
                    <div className="absolute left-14 scale-0 group-hover:scale-100 transition-all duration-200 z-50 py-1.5 px-3 rounded-lg bg-[#faf9f6] dark:bg-[#141520] border border-black/5 dark:border-white/10 text-xs font-bold text-gray-800 dark:text-white whitespace-nowrap shadow-lg">
                      {roomShortName}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Online friends ── */}
        <div className={`flex-1 overflow-y-auto scrollbar-thin px-3 pb-2 min-h-0 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          {!isCollapsed ? (
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2 mb-2 mt-4">
              Online
            </p>
          ) : (
            <div className="h-px w-8 bg-black/5 dark:bg-white/5 my-4" />
          )}
          <div className="space-y-1.5 w-full flex flex-col items-center">
            {friends.map((f) => {
              const av = AVATAR_MAP[f.avatar || 'avatar-cyber-ghost'] || AVATAR_MAP['avatar-cyber-ghost']
              return (
                <Link
                  key={f.id}
                  href={`/space/${f.username}`}
                  className={`flex items-center gap-2.5 rounded-xl group relative transition-all duration-150 cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04] ${
                    isCollapsed ? 'h-10 w-10 justify-center p-0' : 'px-3 py-2 w-full'
                  }`}
                  title={isCollapsed ? f.username : `View ${f.username}'s profile`}
                >
                  <div className="relative shrink-0">
                    <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${av.gradient} flex items-center justify-center text-[9px] font-semibold text-white shadow-sm group-hover:scale-105 transition-transform duration-150`}>
                      {av.symbol}
                    </div>
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 border-2 border-white dark:border-[#0a0b14] shadow-sm" />
                  </div>
                  {!isCollapsed && (
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate lowercase animate-fadeIn group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-150">
                      {f.username}
                    </span>
                  )}

                  {isCollapsed && (
                    <div className="absolute left-14 scale-0 group-hover:scale-100 transition-all duration-200 z-50 py-1.5 px-3 rounded-lg bg-neo-bg border border-black/5 dark:border-white/5 text-xs font-bold text-[var(--primary-text)] whitespace-nowrap shadow-lg">
                      {f.username}
                    </div>
                  )}
                </Link>
              )
            })}
            {friends.length === 0 && !isCollapsed && (
              <p className="px-3 py-2 text-[10px] text-gray-400 dark:text-gray-500 italic animate-fadeIn">
                just you right now 🌙
              </p>
            )}
          </div>
        </div>

        {/* ── Profile footer ── */}
        <div className={`px-3 py-3 border-t border-black/5 dark:border-white/5 shrink-0 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          <div className="flex items-center gap-2 w-full justify-center">
            <button
              onClick={openProfileModal}
              className={`flex items-center rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all duration-150 text-left cursor-pointer group relative ${
                isCollapsed ? 'h-10 w-10 justify-center p-0' : 'p-2 flex-1 gap-2.5'
              }`}
              title="Edit profile"
            >
              <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${activeAvatar.gradient} flex items-center justify-center text-[9px] font-semibold text-white shadow-md shrink-0`}>
                {activeAvatar.symbol}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1 animate-fadeIn">
                  <p className="text-xs font-semibold text-gray-800 dark:text-white truncate lowercase">
                    {activeProfile?.username || 'you'}
                  </p>
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">
                    edit profile
                  </p>
                </div>
              )}

              {isCollapsed && (
                <div className="absolute left-14 scale-0 group-hover:scale-100 transition-all duration-200 z-50 py-1.5 px-3 rounded-lg bg-neo-bg border border-black/5 dark:border-white/5 text-xs font-bold text-[var(--primary-text)] whitespace-nowrap shadow-lg">
                  edit profile ({activeProfile?.username || 'you'})
                </div>
              )}
            </button>

            {/* Theme toggle */}
            {mounted && !isCollapsed && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all cursor-pointer shrink-0 animate-fadeIn"
                title="Toggle theme"
                aria-label="Toggle light/dark mode"
              >
                {theme === 'dark'
                  ? <Sun className="h-3.5 w-3.5 text-amber-400" />
                  : <Moon className="h-3.5 w-3.5 text-indigo-500" />
                }
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="flex bg-neo-bg text-gray-900 dark:text-gray-100 overflow-hidden w-full"
      style={{ height: 'var(--visual-viewport-height, 100dvh)' }}
    >

      {/* ═══════════════════════════════════════════
          DESKTOP SIDEBAR
          ═══════════════════════════════════════════ */}
      <aside
        className={`hidden md:flex flex-col shrink-0 h-full min-h-0 bg-neo-bg shadow-neo border-none transition-all duration-500 ease-in-out z-10 ${
          isSidebarCollapsed ? 'w-20' : 'w-[280px]'
        }`}
        aria-label="Sidebar"
      >
        <SidebarContent isDesktop={true} />
      </aside>

      {/* ═══════════════════════════════════════════
          MOBILE SIDEBAR (full screen, hidden when chat is open)
          ═══════════════════════════════════════════ */}
      {mobileView === 'sidebar' && (
        <div 
          className="md:hidden flex flex-col w-full h-full bg-neo-bg z-10"
          style={{ 
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' 
          }}
        >
          <SidebarContent isDesktop={false} />
          <MobileNav profile={activeProfile || undefined} />
        </div>
      )}

      {/* ═══════════════════════════════════════════
          MAIN CHAT AREA
          ═══════════════════════════════════════════ */}
      <main
        className={`flex-1 min-w-0 min-h-0 h-full ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'} flex-col`}
      >
        {selectedGroup ? (
          selectedGroup.group_name === 'ai logs' ? (
            <SharedAILogsRoom
              key={selectedGroup.id}
              groupId={selectedGroup.id}
              activeUser={activeProfile}
              onBack={() => setMobileView('sidebar')}
            />
          ) : (
              <ChatWindow
              key={selectedGroup.id}
              groupId={selectedGroup.id}
              groupName={selectedGroup.group_name}
              activeUser={activeProfile}
              onBack={() => setMobileView('sidebar')}
              highlightMessageId={highlightMessageId || undefined}
            />
          )
        ) : (
          <div className="flex-1 flex items-center justify-center bg-neo-bg">
            <EmptyState />
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════
          PROFILE CUSTOMIZER MODAL
          ═══════════════════════════════════════════ */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={() => setProfileModalOpen(false)}
          />
          <div className="relative w-full sm:max-w-sm bg-[#fefdfb] dark:bg-[#1c1f26] rounded-t-2xl sm:rounded-2xl border border-black/6 dark:border-white/5 shadow-2xl z-10 p-6 space-y-5 animate-slideUp sm:animate-scaleIn">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-violet-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white lowercase">
                  your space
                </h3>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                  your name
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/3 border border-black/8 dark:border-white/8 rounded-xl py-3 px-4 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-violet-400/60 dark:focus:border-violet-500/50 transition-all font-medium"
                  placeholder="what do they call you..."
                />
              </div>

              {/* Avatar picker */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                  color aura
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {AVATAR_OPTIONS.map((av) => {
                    const isSelected = selectedAvatar === av.id
                    return (
                      <button
                        type="button"
                        key={av.id}
                        onClick={() => setSelectedAvatar(av.id)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? 'border-violet-400 bg-violet-50 dark:bg-violet-500/10'
                            : 'border-black/6 dark:border-white/6 bg-gray-50 dark:bg-[#1c1f26] hover:border-black/10 dark:hover:border-white/10'
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${av.gradient} flex items-center justify-center text-[10px] font-semibold text-white shadow-sm`}>
                          {av.symbol}
                        </div>
                        <span className="text-[9px] font-medium text-gray-500 dark:text-gray-400 truncate max-w-full">
                          {av.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-black/8 dark:border-white/8 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-black/3 dark:hover:bg-white/3 transition-all cursor-pointer"
                >
                  cancel
                </button>
                <Button
                  type="submit"
                  isLoading={isSavingProfile}
                  variant="neon"
                  className="flex-1 py-2.5 rounded-xl text-xs"
                >
                  save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export type { ChatWorkspaceClientProps }
