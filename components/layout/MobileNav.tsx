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
    { href: '/growth', label: 'growth', icon: Compass },
    { href: '/us', label: 'us', icon: Users },
  ]

  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neo-bg shadow-neo-high px-2 flex items-center justify-around select-none border-none transition-all duration-300"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        height: 'calc(3.75rem + env(safe-area-inset-bottom, 8px))',
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
            className={`flex flex-col items-center justify-center gap-1.5 flex-1 min-w-[44px] min-h-[44px] rounded-xl transition-all duration-300 ${
              isActive 
                ? 'bg-neo-bg shadow-neo-inset text-[#7c3aed] font-black py-1.5' 
                : 'text-neo-secondary hover:text-neo-text'
            }`}
            style={{ minHeight: '44px' }}
          >
            <Icon className={`h-[18px] w-[18px] transition-all duration-300 ${isActive ? 'scale-110' : 'active:scale-95'}`} />
            <span className="text-[9px] font-bold lowercase truncate max-w-full tracking-wide leading-none">{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
