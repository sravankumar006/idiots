'use client'

import React from 'react'
import { Calendar, Shield, Award } from 'lucide-react'
import { UserProfile } from '@/types'

// Maps the chosen avatar ID to CSS gradient properties and initials
export const AVATAR_MAP: Record<string, { gradient: string; symbol: string; name: string }> = {
  'avatar-cyber-ghost': { gradient: 'from-cyan-400 to-blue-500', symbol: 'CG', name: 'Cyber Ghost' },
  'avatar-neon-pulse': { gradient: 'from-fuchsia-500 to-purple-600', symbol: 'NP', name: 'Neon Pulse' },
  'avatar-alpha-wing': { gradient: 'from-emerald-400 to-teal-500', symbol: 'AW', name: 'Alpha Wing' },
  'avatar-solar-flare': { gradient: 'from-amber-400 to-orange-500', symbol: 'SF', name: 'Solar Flare' },
  'avatar-void-runner': { gradient: 'from-pink-500 to-rose-600', symbol: 'VR', name: 'Void Runner' },
  'avatar-shadow-blade': { gradient: 'from-slate-600 to-slate-800', symbol: 'SB', name: 'Shadow Blade' },
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
      <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Avatar bubble with glowing rings */}
      <div className="relative mb-3.5">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-violet-500/20 to-rose-500/20 blur-md opacity-70" />
        <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${avatar.gradient} flex items-center justify-center text-xl font-black text-black border border-white/20 relative z-10 shadow-lg`}>
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
          <span className="text-violet-600 dark:text-violet-300 font-bold">{avatar.name}</span>
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
