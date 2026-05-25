'use client'

import React from 'react'
import { Sparkles, MessageSquare, Cpu, Radio } from 'lucide-react'
import { UserProfile } from '@/types'
import UserCard from './UserCard'

interface RightPanelProps {
  profile: UserProfile
  isOpen: boolean
}

export default function RightPanel({ profile, isOpen }: RightPanelProps) {
  if (!isOpen) return null

  return (
    <aside className="hidden lg:flex flex-col w-80 h-full glass-panel border-l border-white/5 p-5 gap-6 select-none overflow-y-auto shrink-0 animate-slideLeft">
      
      {/* 1. Identity Segment */}
      <div>
        <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-3">
          Established Identity
        </p>
        <UserCard profile={profile} />
      </div>

      {/* 2. Connection Peers Segment */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase flex items-center justify-between">
          <span>Active Connections</span>
          <span className="text-violet-400 font-extrabold text-[9px] bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">2 Connected</span>
        </p>
        <div className="space-y-2">
          {/* Peer 1 */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/2 transition-all">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-[10px] font-extrabold text-black">
              NP
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">Neon Pulse</p>
              <p className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-ping" />
                Active Link
              </p>
            </div>
          </div>
          {/* Peer 2 */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/2 transition-all">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[10px] font-extrabold text-black">
              SF
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">Solar Flare</p>
              <p className="text-[9px] text-gray-400 font-medium">Idle 4m ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. IS Companion Hub */}
      <div className="mt-auto bg-gradient-to-br from-violet-500/5 to-rose-500/5 border border-violet-500/10 rounded-2xl p-4 space-y-3 relative overflow-hidden group">
        
        {/* Glowing aura */}
        <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-violet-400/10 blur-xl group-hover:scale-125 transition-transform duration-500" />
        
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <Cpu className="h-3.5 w-3.5" />
          </div>
          <span className="text-[11px] font-extrabold tracking-wider text-white">
            IS Companion
          </span>
        </div>
        <p className="text-[10px] text-gray-400 leading-relaxed">
          Hello! I am standing by to assist with note-summarization, study metrics, and workspace navigation. Let me know when you want to link.
        </p>
        <button className="w-full py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/25 text-[10px] font-bold text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/40 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1">
          <Sparkles className="h-3 w-3" />
          <span>Synchronize Companion</span>
        </button>
      </div>

    </aside>
  )
}
