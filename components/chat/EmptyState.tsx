'use client'

import React from 'react'
import { MessageSquare, ArrowRight } from 'lucide-react'

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center border border-black/5 dark:border-white/5 bg-white/10 dark:bg-white/2 rounded-3xl max-w-md mx-auto select-none space-y-6 relative overflow-hidden">
      
      {/* Glow element */}
      <div className="absolute top-[-100px] left-[-100px] h-48 w-48 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

      <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-rose-500/10 border border-violet-500/20 text-violet-500 dark:text-violet-400 relative z-10">
        <MessageSquare className="h-8 w-8" />
      </div>

      <div className="space-y-2 relative z-10">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white lowercase tracking-wide">
          shared space
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
          select a channel to message your friends, share memories, and hang out.
        </p>
      </div>

      <div className="pt-2 text-[10px] text-gray-500 dark:text-gray-400 font-medium lowercase tracking-wider flex items-center gap-1.5">
        <span>awaiting a chat</span>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
      </div>
    </div>
  )
}
