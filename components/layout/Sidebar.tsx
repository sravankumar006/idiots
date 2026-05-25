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
  ChevronRight
} from 'lucide-react'

// Define our navigation links
const NAV_ITEMS = [
  { href: '/dashboard', label: 'home', icon: LayoutDashboard },
  { href: '/chat', label: 'chat lounge', icon: MessageSquare },
  { href: '/ai', label: 'companion', icon: Sparkles },
  { href: '/study', label: 'zen focus', icon: Clock },
  { href: '/memories', label: 'memories', icon: Brain },
  { href: '/projects', label: 'creative rooms', icon: FolderHeart },
  { href: '/settings', label: 'settings', icon: Settings },
]

interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside 
      className={`flex flex-col h-full glass-panel border-r border-white/5 transition-all duration-500 ease-in-out select-none shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Branding Section */}
      <div className={`flex items-center h-16 px-5 border-b border-white/5 ${
        isCollapsed ? 'justify-center' : 'justify-between'
      }`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 animate-fadeIn">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-violet-500 to-rose-400 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.2)]">
              <span className="text-black font-extrabold text-[10px]">IS</span>
            </div>
            <span className="font-extrabold tracking-wider text-sm text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-rose-200 lowercase">
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
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer"
            title="Collapse Sidebar"
            suppressHydrationWarning
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 py-3 px-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 relative group cursor-pointer ${
                isActive 
                  ? 'text-white bg-gradient-to-r from-violet-500/10 via-rose-500/5 to-transparent border-l-2 border-violet-400' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/3'
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                isActive ? 'text-violet-400' : 'text-gray-400 group-hover:text-violet-300'
              }`} />
              
              {!isCollapsed && (
                <span className="animate-fadeIn">{item.label}</span>
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 z-50 py-1.5 px-3 rounded-lg bg-gray-950 border border-white/10 text-xs font-semibold text-white whitespace-nowrap shadow-lg">
                  {item.label}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions Area */}
      <div className="p-3 border-t border-white/5">
        {isCollapsed ? (
          <button 
            onClick={() => setIsCollapsed(false)}
            className="w-full py-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
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
