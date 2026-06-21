'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  MessageSquare, 
  Sparkles, 
  History, 
  Archive, 
  Clock, 
  FolderHeart, 
  Brain, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { UserProfile } from '@/types'

interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  profile?: UserProfile
}

export default function Sidebar({ isCollapsed, setIsCollapsed, profile }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    // Main Group
    { href: '/dashboard', label: 'home', icon: Home, group: 'space' },
    { href: '/chat', label: 'chat lounge', icon: MessageSquare, group: 'space' },
    { href: '/ai', label: 'companion', icon: Sparkles, group: 'space' },
    // Us Group
    { href: '/us/timeline', label: 'timeline', icon: History, group: 'us' },
    { href: '/us/vault', label: 'scrapbook vault', icon: Archive, group: 'us' },
    // Growth Group
    { href: '/focus', label: 'zen focus', icon: Clock, group: 'growth' },
    { href: '/growth/creative', label: 'creative rooms', icon: FolderHeart, group: 'growth' },
    { href: '/growth/memories', label: 'memories', icon: Brain, group: 'growth' },
    // System Group
    { href: '/settings', label: 'settings', icon: Settings, group: 'system' }
  ]

  const renderLink = (item: { href: string; label: string; icon: any }) => {
    const Icon = item.icon
    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
    
    if (isCollapsed) {
      return (
        <Link
          key={item.href}
          href={item.href}
          className="group relative flex items-center justify-center w-full"
        >
          <div
            className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              isActive
                ? 'bg-neo-bg shadow-neo-high text-[var(--foreground)] border border-[var(--active-color)]/20 shadow-[0_0_12px_rgba(138,132,123,0.15)] translate-y-[-2px]'
                : 'bg-transparent text-[var(--secondary-text)] rounded-full hover:bg-neo-bg hover:shadow-neo hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5'
            }`}
          >
            <Icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${
              isActive ? 'text-[var(--foreground)]' : 'text-[var(--secondary-text)]'
            }`} />
          </div>

          {/* Tooltip Label */}
          <div className="absolute left-20 scale-0 group-hover:scale-100 transition-all duration-150 z-50 py-1.5 px-3 rounded-xl bg-neo-bg shadow-neo border border-white/5 text-[10px] font-semibold text-[var(--primary-text)] uppercase tracking-wider whitespace-nowrap pointer-events-none">
            {item.label}
          </div>
        </Link>
      )
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3.5 py-2 px-3 font-bold lowercase tracking-wide text-xs transition-all duration-300 rounded-full group w-full ${
          isActive 
            ? 'bg-neo-bg shadow-neo-inset text-[var(--foreground)] font-bold border border-[var(--active-color)]/5' 
            : 'bg-transparent text-[var(--secondary-text)] hover:bg-neo-bg hover:shadow-neo hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5'
        }`}
      >
        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
          isActive ? 'bg-neo-bg shadow-neo text-[var(--foreground)]' : 'bg-transparent text-[var(--secondary-text)]'
        }`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <span className="animate-fadeIn truncate leading-none mt-0.5 text-[11px] font-semibold uppercase tracking-wider">{item.label}</span>
      </Link>
    )
  }

  return (
    <aside 
      className={`flex flex-col h-[calc(100vh-2rem)] m-4 rounded-[32px] bg-neo-bg shadow-neo-high transition-all duration-500 ease-in-out select-none shrink-0 border border-white/5 ${
        isCollapsed ? 'w-[88px]' : 'w-64'
      }`}
    >
      {/* Branding Plate */}
      <div className={`flex items-center h-20 px-4 border-none justify-center shrink-0`}>
        {!isCollapsed ? (
          <div className="w-full bg-neo-bg shadow-neo-inset px-4 py-2 rounded-full flex items-center justify-between gap-3 transition-all duration-300">
            <div className="flex items-center gap-2.5 animate-fadeIn">
              <div className="h-8 w-8 rounded-full bg-neo-bg shadow-neo flex items-center justify-center text-[var(--active-color)] font-extrabold text-[10px] hover:shadow-neo hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5 transition-all duration-300 cursor-pointer">
                is
              </div>
              <span className="font-extrabold tracking-wider text-[11px] text-[var(--secondary-text)] uppercase leading-none mt-0.5">
                idiots space
              </span>
            </div>
            
            <button 
              onClick={() => setIsCollapsed(true)}
              className="w-7 h-7 rounded-full bg-neo-bg shadow-neo flex items-center justify-center text-[var(--secondary-text)] hover:text-[var(--foreground)] hover:shadow-neo active:shadow-neo-inset transition-all duration-300 cursor-pointer border-none"
              title="Collapse Sidebar"
              suppressHydrationWarning
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsCollapsed(false)}
            className="h-12 w-12 rounded-full bg-neo-bg shadow-neo flex items-center justify-center text-[var(--active-color)] hover:shadow-neo hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5 transition-all duration-300 cursor-pointer border-none"
            title="Expand Sidebar"
            suppressHydrationWarning
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 flex flex-col items-center py-4 px-3 overflow-y-auto scrollbar-none gap-6">
        {['space', 'us', 'growth', 'system'].map((groupName) => {
          const groupItems = navItems.filter(item => item.group === groupName)
          if (groupItems.length === 0) return null

          return (
            <div key={groupName} className="flex flex-col items-center gap-2.5 w-full relative">
              {groupName !== 'space' && (
                <div className="w-8 h-[1px] bg-black/10 dark:bg-white/10 mb-2" />
              )}
              {groupItems.map(item => renderLink(item))}
            </div>
          )
        })}
      </nav>

      {/* Footer / Heartbeat indicator */}
      <div className="py-4 flex justify-center items-center shrink-0">
        {!isCollapsed ? (
          <span className="text-[9px] text-[var(--active-color)]/50 font-bold uppercase tracking-wider block">
            idiots space • heartbeat
          </span>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--active-color)] animate-pulse" />
        )}
      </div>
    </aside>
  )
}
