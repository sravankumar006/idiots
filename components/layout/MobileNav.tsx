'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home,
  MessageSquare, 
  Sparkles, 
  Compass, 
  Users
} from 'lucide-react'
import { UserProfile } from '@/types'

interface MobileNavProps {
  profile?: UserProfile
  drawerOpen?: boolean
  setDrawerOpen?: (open: boolean) => void
}

export default function MobileNav({ profile, drawerOpen, setDrawerOpen }: MobileNavProps) {
  const pathname = usePathname()

  const tabs = [
    { href: '/dashboard', label: 'home', icon: Home },
    { href: '/chat', label: 'chat lounge', icon: MessageSquare },
    { href: '/ai', label: 'companion', icon: Sparkles },
    { href: '/growth', label: 'career', icon: Compass },
    { href: '/us', label: 'us', icon: Users },
  ]

  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#faf9f6]/80 dark:bg-[#16181d]/85 backdrop-blur-xl border-t border-black/5 dark:border-white/5 px-2 flex items-center justify-around select-none shadow-[0_-4px_24px_rgba(0,0,0,0.04)]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        // Match exact or starts with sub-routes
        const isActive = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
        
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center gap-1.5 py-1 text-[10px] font-bold tracking-wider transition-all duration-300 ease-out flex-1 min-w-[50px] min-h-[48px] ${
              isActive ? 'text-violet-600 dark:text-violet-400' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
            style={{ minHeight: '48px' }} // Ensures touch target size >= 44px
          >
            <Icon className={`h-5.5 w-5.5 transition-transform active:scale-90 ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400 dark:text-gray-500'}`} />
            <span className="lowercase truncate max-w-full">{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
