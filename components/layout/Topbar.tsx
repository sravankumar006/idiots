'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Bell, Search, Users, Menu, Sparkles, Sun, Moon } from 'lucide-react'
import { UserProfile } from '@/types'
import { useTheme } from 'next-themes'


const PATH_TITLES: Record<string, string> = {
  '/dashboard': 'home',
  '/chat': 'chat lounge',
  '/ai': 'companion',
  '/study': 'zen focus',
  '/memories': 'memories',
  '/projects': 'creative rooms',
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
  const pageTitle = PATH_TITLES[pathname] || 'idiots space'

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="glass-panel border-b border-black/5 dark:border-white/5 h-16 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30 select-none">
      
      {/* Left: Mobile Menu Trigger + Route Title */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-950 dark:hover:text-white transition-all cursor-pointer"
          title="Toggle Navigation"
          suppressHydrationWarning
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-violet-400 animate-pulse" />
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
          className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl py-2 pl-4 pr-10 text-xs text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-violet-500/40 transition-all font-medium"
          suppressHydrationWarning
        />
        <Search className="h-4 w-4 text-gray-500 absolute right-3" />
      </div>

      {/* Right: Quick Interactions */}
      <div className="flex items-center gap-4">
        {/* Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 bg-violet-500/5 border border-violet-500/10 py-1.5 px-3 rounded-full text-[10px] font-bold text-violet-400 lowercase">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse shadow-[0_0_6px_rgba(139,92,246,0.5)]" />
          <span>connected & synced</span>
        </div>

        {/* Theme Toggle Switcher */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-950 dark:hover:text-white transition-all cursor-pointer"
            title="Toggle color theme"
            suppressHydrationWarning
          >
            {theme === 'dark' ? (
              <Sun className="h-4.5 w-4.5 text-amber-400 hover:scale-115 transition-transform duration-300" />
            ) : (
              <Moon className="h-4.5 w-4.5 text-indigo-500 hover:scale-115 transition-transform duration-300" />
            )}
          </button>
        )}

        {/* Notifications Mock */}
        <button 
          className="relative p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-950 dark:hover:text-white transition-all cursor-pointer"
          suppressHydrationWarning
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-50 shadow-[0_0_6px_#f43f5e]" />
        </button>

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

        {/* User Quick Profile Icon */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-rose-400 flex items-center justify-center text-xs font-bold text-black border border-white/10 shadow-md">
            {profile.username.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

    </header>
  )
}
