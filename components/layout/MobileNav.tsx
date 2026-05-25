'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  MessageSquare, 
  Sparkles, 
  Clock, 
  Menu, 
  X, 
  Brain, 
  FolderHeart, 
  Settings, 
  LogOut 
} from 'lucide-react'
import { logout } from '@/app/auth/actions'

interface MobileNavProps {
  onToggleMobileMenu?: () => void
}

export default function MobileNav({ onToggleMobileMenu }: MobileNavProps) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isLoggingOut, startLogoutTransition] = useTransition()

  const tabs = [
    { href: '/dashboard', label: 'Hub', icon: LayoutDashboard },
    { href: '/chat', label: 'Chat', icon: MessageSquare },
    { href: '/ai', label: 'AI', icon: Sparkles },
    { href: '/study', label: 'Focus', icon: Clock },
  ]

  const handleLogoutClick = () => {
    startLogoutTransition(async () => {
      await logout()
    })
  }

  return (
    <>
      {/* 1. Glassmorphic Bottom Tab Navbar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#0a0b14]/70 backdrop-blur-xl border-t border-white/5 px-6 flex items-center justify-between select-none">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname === tab.href
          
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 py-1 text-[10px] font-bold tracking-wider transition-all duration-300 ${
                isActive ? 'text-violet-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform active:scale-95 ${isActive ? 'text-violet-400' : 'text-gray-500'}`} />
              <span>{tab.label}</span>
            </Link>
          )
        })}

        {/* Menu Toggle Button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={`flex flex-col items-center gap-1 py-1 text-[10px] font-bold tracking-wider transition-all cursor-pointer ${
            drawerOpen ? 'text-violet-400' : 'text-gray-500'
          }`}
        >
          <Menu className="h-5 w-5" />
          <span>Menu</span>
        </button>
      </div>

      {/* 2. Slide-up Drawer Overlay */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
          {/* Backdrop Tap Target to Close */}
          <div className="absolute inset-0" onClick={() => setDrawerOpen(false)} />
          
          {/* Drawer Sheet */}
          <div className="relative w-full bg-[#0a0b15] border-t border-white/10 rounded-t-3xl p-6 space-y-6 shadow-2xl z-10 animate-slideUp">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-violet-500 to-rose-400 flex items-center justify-center text-[10px] font-black text-black">
                  IS
                </div>
                <span className="text-xs font-bold tracking-widest text-white uppercase">Idiots Space Navigation</span>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-gray-400 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav Menu Lists */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/memories"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white/2 border border-white/5 text-xs font-semibold text-gray-300 hover:text-white"
              >
                <Brain className="h-4.5 w-4.5 text-violet-400" />
                <span>Mind Logs</span>
              </Link>
              
              <Link
                href="/projects"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white/2 border border-white/5 text-xs font-semibold text-gray-300 hover:text-white"
              >
                <FolderHeart className="h-4.5 w-4.5 text-rose-400" />
                <span>Creative Rooms</span>
              </Link>

              <Link
                href="/settings"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white/2 border border-white/5 text-xs font-semibold text-gray-300 hover:text-white col-span-2"
              >
                <Settings className="h-4.5 w-4.5 text-gray-400" />
                <span>Preferences</span>
              </Link>
            </div>

            {/* Logout Action */}
            <button
              onClick={handleLogoutClick}
              disabled={isLoggingOut}
              className="w-full py-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/25 border border-red-500/25 hover:border-red-500/50 text-xs font-bold text-red-400 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoggingOut ? 'Disconnecting...' : 'Sign Out'}
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
