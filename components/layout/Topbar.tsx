'use client'

import React, { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Bell, Search, Users, Menu, Sparkles, Sun, Moon, 
  Check, Trash2, MessageSquare, BookOpen, Trophy, CloudLightning, ShieldAlert 
} from 'lucide-react'
import { UserProfile } from '@/types'
import { useTheme } from 'next-themes'
import { useNotifications } from '@/hooks/useNotifications'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import UserActionSheet from './UserActionSheet'


const PATH_TITLES: Record<string, string> = {
  '/dashboard': 'home',
  '/chat': 'chat lounge',
  '/ai': 'companion',
  '/us': 'us hub',
  '/us/timeline': 'shared timeline',
  '/us/vault': 'scrapbook vault',
  '/growth': 'growth dashboard',
  '/growth/focus': 'zen focus',
  '/growth/creative': 'creative rooms',
  '/settings': 'settings',
}

interface TopbarProps {
  profile: UserProfile
  rightPanelOpen: boolean
  setRightPanelOpen: (open: boolean) => void
  onToggleMobileMenu: () => void
}

export default function Topbar({ 
  profile, 
  rightPanelOpen, 
  setRightPanelOpen, 
  onToggleMobileMenu 
}: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const pageTitle = PATH_TITLES[pathname] || 'idiots space'

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [userSheetOpen, setUserSheetOpen] = useState(false)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications(profile.id)

  const { 
    permission: pushPermission, 
    requestPermissionAndRegister 
  } = usePushNotifications()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'chat':
        return <MessageSquare className="h-3.5 w-3.5 text-violet-400" />
      case 'focus':
        return <BookOpen className="h-3.5 w-3.5 text-amber-400" />
      case 'ai':
        return <Sparkles className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
      case 'memory':
        return <CloudLightning className="h-3.5 w-3.5 text-cyan-400" />
      case 'achievement':
        return <Trophy className="h-3.5 w-3.5 text-yellow-400" />
      default:
        return <Bell className="h-3.5 w-3.5 text-gray-400" />
    }
  }
// Detect mobile viewport
const [isMobile, setIsMobile] = useState(false);
useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 640); // Tailwind sm breakpoint
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);

  const handleNotificationClick = (notification: any) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    setDropdownOpen(false)

    // Construct query parameters for deep linking
    const params = new URLSearchParams()
    if (notification.room_id) params.set('roomId', notification.room_id)
    if (notification.message_id) params.set('messageId', notification.message_id)
    if (notification.entity_id) params.set('entityId', notification.entity_id)

    const queryString = params.toString() ? `?${params.toString()}` : ''

    // Route to corresponding area
    switch (notification.category) {
      case 'chat':
        router.push(`/chat${queryString}`)
        break
      case 'focus':
        router.push(`/growth/focus${queryString}`)
        break
      case 'ai':
        router.push(`/ai${queryString}`)
        break
      case 'memory':
        router.push(`/us/vault${queryString}`)
        break
      case 'achievement':
        router.push(`/growth${queryString}`)
        break
      default:
        router.push('/dashboard')
    }
  }

  return (
    <>
      <div className="pt-0.5 pl-0 pr-1 md:pt-1.5 md:pl-0.5 md:pr-1.5 shrink-0 z-40 bg-transparent relative">
        <header className="h-16 flex items-center justify-between px-4 md:px-6 select-none glass-panel rounded-3xl border-none w-full">
      
      {/* Left: Mobile Menu Trigger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setUserSheetOpen(true)}
          className="md:hidden flex items-center justify-center h-9 w-9 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer shrink-0 border-none bg-transparent"
          title="Open profile menu"
          aria-label="Open profile menu"
        >
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-logo-start to-logo-end flex items-center justify-center text-[10px] font-black text-black shadow-sm hover:scale-105 active:scale-95 transition-transform">
            IS
          </div>
        </button>


        <div className="flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-[var(--accent-warm)] animate-pulse" />
          <h1 className="text-base font-extrabold tracking-wide text-gray-900 dark:text-white">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Middle: Integrated Search Field */}
      <div className="hidden sm:flex items-center max-w-xs w-full relative">
        <input 
          type="text" 
          placeholder="Search connections..." 
          className="w-full glass-input rounded-xl py-2.5 pl-4 pr-10 text-xs text-neo-text placeholder:text-gray-400 focus:outline-none transition-all duration-300 font-medium"
          suppressHydrationWarning
        />
        <Search className="h-4 w-4 text-gray-500 absolute right-3" />
      </div>

      {/* Right: Quick Interactions */}
      <div className="flex items-center gap-4">
        {/* Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 bg-neo-bg shadow-neo-inset py-1.5 px-3 rounded-full text-[10px] font-bold text-[var(--foreground)] lowercase">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--active-color)] animate-pulse" />
          <span>connected & synced</span>
        </div>

        {/* Theme Toggle Switcher */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-full bg-neo-bg shadow-neo text-neo-secondary hover:shadow-neo hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5 transition-all duration-300 cursor-pointer border-none"
            title="Toggle color theme"
            suppressHydrationWarning
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400 hover:scale-115 transition-transform duration-300" />
            ) : (
              <Moon className="h-4 w-4 text-gray-700 hover:scale-115 transition-transform duration-300" />
            )}
          </button>
        )}

        {/* Dynamic Notification Bell with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            aria-label="Notifications"
            className={`relative p-2.5 rounded-full transition-all duration-300 cursor-pointer border-none ${
              dropdownOpen 
                ? 'bg-neo-bg shadow-neo-inset text-[var(--active-color)]' 
                : 'bg-neo-bg shadow-neo text-neo-secondary hover:shadow-neo hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5'
            }`}
            title="Notifications"
            suppressHydrationWarning
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 flex items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white shadow-[0_0_8px_rgba(244,63,94,0.5)]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Popover */}
          {dropdownOpen && (
            isMobile ? (
              // Mobile full-screen overlay
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-end">
                <div className="relative w-full h-full max-w-sm glass-panel shadow-2xl overflow-y-auto animate-slideInRight">
                  {/* Close button */}
                  <button
                    onClick={() => setDropdownOpen(false)}
                    className="p-2 absolute top-2 right-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                    aria-label="Close notifications"
                  >
                    ✕
                  </button>
                  {/* Reuse the same content as desktop */}
                  <div className="pt-8">
                    {/* Header */}
                    <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full lowercase">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[10px] font-bold text-violet-500 dark:text-violet-400 hover:text-violet-600 dark:hover:text-violet-300 transition-colors bg-transparent border-none cursor-pointer"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    {/* Permission Header */}
                    {pushPermission === 'default' && (
                      <div className="p-3 bg-violet-500/5 dark:bg-violet-500/10 border-b border-violet-500/10 flex items-center justify-between gap-3">
                        <div className="flex items-start gap-2 min-w-0">
                          <ShieldAlert className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-gray-900 dark:text-white block lowercase">
                              enable push notifications
                            </span>
                            <span className="text-[9px] text-gray-500 dark:text-gray-400 font-semibold block leading-tight truncate">
                              never miss replies or milestones.
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={requestPermissionAndRegister}
                          className="px-2.5 py-1 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-[9px] font-bold transition-all cursor-pointer shrink-0"
                        >
                          allow
                        </button>
                      </div>
                    )}
                    {/* Notifications List */}
                    <div className="max-h-[calc(100vh-200px)] overflow-y-auto divide-y divide-black/5 dark:divide-white/5">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                          <Bell className="h-6 w-6 text-gray-400 dark:text-gray-600" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold lowercase">
                            No notifications yet
                          </span>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id}
                            className={`p-3.5 flex items-start justify-between gap-3.5 transition-colors relative hover:bg-black/[0.02] dark:hover:bg-white/[0.01] ${
                              !n.is_read ? 'bg-violet-500/[0.02] dark:bg-violet-500/[0.01]' : ''
                            }`}
                          >
                            <div className="h-8 w-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                              {getCategoryIcon(n.category)}
                            </div>
                            <div onClick={() => handleNotificationClick(n)} className="flex-1 min-w-0 cursor-pointer text-left">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[11px] font-extrabold ${!n.is_read ? 'text-gray-950 dark:text-white' : 'text-gray-500 dark:text-gray-400'} lowercase truncate block`}>
                                  {n.title}
                                </span>
                                {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />}
                              </div>
                              <p className={`text-[10px] ${!n.is_read ? 'text-gray-700 dark:text-gray-300 font-semibold' : 'text-gray-400 dark:text-gray-500'} leading-relaxed mt-0.5 break-words line-clamp-2`}>
                                {n.body}
                              </p>
                              <span className="text-[8.5px] text-gray-400 dark:text-gray-500 font-semibold block mt-1">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 self-center">
                              {!n.is_read && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); markAsRead(n.id) }}
                                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-400 transition-colors bg-transparent border-none cursor-pointer"
                                  title="Mark as read"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteNotification(n.id) }}
                                className="p-1 text-gray-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors bg-transparent border-none cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Desktop popover (existing markup)
              <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl glass-panel shadow-2xl z-50 overflow-hidden animate-scaleIn select-none">
                {/* Header */}
                <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full lowercase">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] font-bold text-[var(--active-color)] hover:opacity-85 transition-colors bg-transparent border-none cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                {/* Permission Header */}
                {pushPermission === 'default' && (
                  <div className="p-3 bg-[var(--active-color)]/5 dark:bg-[var(--active-color)]/10 border-b border-[var(--active-color)]/10 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <ShieldAlert className="h-4 w-4 text-[var(--accent-warm)] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-gray-900 dark:text-white block lowercase">
                          enable push notifications
                        </span>
                        <span className="text-[9px] text-gray-500 dark:text-gray-400 font-semibold block leading-tight truncate">
                          never miss replies or milestones.
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={requestPermissionAndRegister}
                      className="px-2.5 py-1 bg-[var(--active-color)] hover:opacity-95 text-white rounded-lg text-[9px] font-bold transition-all cursor-pointer shrink-0 border-none"
                    >
                      allow
                    </button>
                  </div>
                )}
                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-black/5 dark:divide-white/5">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                      <Bell className="h-6 w-6 text-gray-400 dark:text-gray-600" />
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold lowercase">
                        No notifications yet
                      </span>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id}
                        className={`p-3.5 flex items-start justify-between gap-3.5 transition-colors relative hover:bg-black/[0.02] dark:hover:bg-white/[0.01] ${
                          !n.is_read ? 'bg-[var(--active-color)]/[0.02] dark:bg-[var(--active-color)]/[0.01]' : ''
                        }`}
                      >
                        {/* Left: Category Icon */}
                        <div className="h-8 w-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                          {getCategoryIcon(n.category)}
                        </div>
                        {/* Middle: Content */}
                        <div 
                          onClick={() => handleNotificationClick(n)}
                          className="flex-1 min-w-0 cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[11px] font-extrabold ${!n.is_read ? 'text-gray-950 dark:text-white' : 'text-gray-500 dark:text-gray-400'} lowercase truncate block`}>
                              {n.title}
                            </span>
                            {!n.is_read && (
                              <span className="h-1.5 w-1.5 rounded-full bg-[var(--active-color)] shrink-0" />
                            )}
                          </div>
                          <p className={`text-[10px] ${!n.is_read ? 'text-gray-700 dark:text-gray-300 font-semibold' : 'text-gray-400 dark:text-gray-500'} leading-relaxed mt-0.5 break-words line-clamp-2`}>
                            {n.body}
                          </p>
                          <span className="text-[8.5px] text-gray-400 dark:text-gray-500 font-semibold block mt-1">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {/* Right: Quick Actions */}
                        <div className="flex items-center gap-1.5 shrink-0 self-center">
                          {!n.is_read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markAsRead(n.id) }}
                              className="p-1 text-gray-400 dark:text-gray-500 hover:text-[var(--active-color)] transition-colors bg-transparent border-none cursor-pointer"
                              title="Mark as read"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteNotification(n.id) }}
                            className="p-1 text-gray-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors bg-transparent border-none cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* Toggle Right Panel (Desktop/Tablet) */}
        <button 
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className={`hidden md:flex p-2 rounded-xl transition-all cursor-pointer ${
            rightPanelOpen 
              ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' 
              : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-950 dark:hover:text-white'
          }`}
          title="view details"
          suppressHydrationWarning
        >
          <Users className="h-4 w-4" />
        </button>
        {/* User Quick Profile Icon removed */}
      </div>

      </header>
      </div>
      {userSheetOpen && (
        <UserActionSheet 
          profile={profile} 
          onClose={() => setUserSheetOpen(false)} 
        />
      )}
    </>
  )
}
