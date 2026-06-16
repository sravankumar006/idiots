'use client'

import React from 'react'
import { Calendar, Shield, Award } from 'lucide-react'
import { UserProfile } from '@/types'

// Maps the chosen avatar ID to CSS gradient properties and initials
export const AVATAR_MAP: Record<string, { gradient: string; symbol: string; name: string }> = {
  'avatar-cyber-ghost': { gradient: 'from-[#3A3530] to-[#2B2824]', symbol: 'CS', name: 'Carbon Slate' },
  'avatar-neon-pulse': { gradient: 'from-[#8A7968] to-[#5C4F42]', symbol: 'MB', name: 'Metallic Bronze' },
  'avatar-alpha-wing': { gradient: 'from-[#606E59] to-[#3D4739]', symbol: 'OM', name: 'Olive Moss' },
  'avatar-solar-flare': { gradient: 'from-[#A87955] to-[#704F34]', symbol: 'WA', name: 'Warm Amber' },
  'avatar-void-runner': { gradient: 'from-[#A85840] to-[#703626]', symbol: 'BR', name: 'Burnt Rust' },
  'avatar-shadow-blade': { gradient: 'from-[#2A2824] to-[#1C1A17]', symbol: 'DC', name: 'Deep Charcoal' },
}

interface UserCardProps {
  profile: UserProfile
}

export default function UserCard({ profile }: UserCardProps) {
  const avatar = AVATAR_MAP[profile.avatar] || AVATAR_MAP['avatar-cyber-ghost']
  
  const creationDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  return (
    <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-5 text-center flex flex-col items-center shadow-lg relative overflow-hidden group">
      
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--active-color)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Avatar bubble with glowing rings */}
      <div className="relative mb-3.5">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[var(--active-color)]/20 to-[var(--accent-warm)]/10 blur-md opacity-70" />
        <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${avatar.gradient} flex items-center justify-center text-xl font-black text-white border border-white/20 relative z-10 shadow-lg`}>
          {avatar.symbol}
        </div>
      </div>

      <h3 className="text-sm font-extrabold text-gray-900 dark:text-white tracking-wide">
        {profile.username}
      </h3>
      <p className="text-[11px] text-gray-400 truncate w-full mt-0.5">
        {profile.email}
      </p>

      {/* Details List */}
      <div className="w-full mt-4 pt-4 border-t border-black/5 dark:border-white/5 space-y-2 text-left">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="h-3 w-3" />
            Class
          </span>
          <span className="text-[var(--active-color)] font-bold">{avatar.name}</span>
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Award className="h-3 w-3" />
            Node ID
          </span>
          <span className="text-gray-700 dark:text-gray-300 font-mono font-medium truncate max-w-[100px]" title={profile.id}>
            {profile.id.substring(0, 8)}...
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            Created
          </span>
          <span className="text-gray-400 font-semibold">{creationDate}</span>
        </div>
      </div>
    </div>
  )
}
