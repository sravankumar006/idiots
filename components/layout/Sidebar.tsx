'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  MessageSquare, 
  Sparkles, 
  Clock, 
  Brain, 
  FolderHeart, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  History
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
    { href: '/dashboard', label: 'home', icon: LayoutDashboard },
    { href: '/chat', label: 'chat lounge', icon: MessageSquare },
    { href: '/ai', label: 'companion', icon: Sparkles },
    { href: `/space/${profile?.username || 'me'}`, label: 'my corner', icon: Home },
    { href: '/timeline', label: 'shared timeline', icon: History },
    { href: '/study', label: 'zen focus', icon: Clock },
    { href: '/memories', label: 'memories', icon: Brain },
    { href: '/projects', label: 'creative rooms', icon: FolderHeart },
    { href: '/settings', label: 'settings', icon: Settings },
  ]

  return (
    <aside 
      className={`flex flex-col h-full glass-panel border-r border-black/5 dark:border-white/5 transition-all duration-500 ease-in-out select-none shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Branding Section */}
      <div className={`flex items-center h-16 px-5 border-b border-black/5 dark:border-white/5 ${
        isCollapsed ? 'justify-center' : 'justify-between'
      }`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 animate-fadeIn">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-violet-500 to-rose-400 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.2)]">
              <span className="text-black font-extrabold text-[10px]">IS</span>
            </div>
            <span className="font-extrabold tracking-wider text-sm text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-violet-600 to-rose-500 dark:from-white dark:via-violet-200 dark:to-rose-200 lowercase">
              idiots space
            </span>
          </div>
        )}
        {isCollapsed && (
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-violet-500 to-rose-400 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.3)]">
            <span className="text-black font-extrabold text-xs">IS</span>
          </div>
        )}

        {/* Collapse Button */}
        {!isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-950 dark:hover:text-white transition-all cursor-pointer"
            title="Collapse Sidebar"
            suppressHydrationWarning
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 py-3 px-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 relative group cursor-pointer ${
                isActive 
                  ? 'text-violet-600 dark:text-white bg-gradient-to-r from-violet-500/10 via-rose-500/5 to-transparent border-l-2 border-violet-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-black/3 dark:hover:bg-white/3'
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                isActive ? 'text-violet-500 dark:text-violet-400' : 'text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-300'
              }`} />
              
              {!isCollapsed && (
                <span className="animate-fadeIn">{item.label}</span>
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 z-50 py-1.5 px-3 rounded-lg bg-[#fefdfb] dark:bg-[#1c1f26] border border-black/5 dark:border-white/10 text-xs font-semibold text-gray-800 dark:text-white whitespace-nowrap shadow-lg">
                  {item.label}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions Area */}
      <div className="p-3 border-t border-black/5 dark:border-white/5">
        {isCollapsed ? (
          <button 
            onClick={() => setIsCollapsed(false)}
            className="w-full py-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-950 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Expand Sidebar"
            suppressHydrationWarning
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        ) : (
          <div className="text-center py-2 select-none">
            <span className="text-[10px] text-violet-400/50 font-bold lowercase tracking-wider block">
              idiots space • heartbeat
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}
