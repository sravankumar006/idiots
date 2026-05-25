'use client'

import React from 'react'
import { Sparkles, MessageSquare } from 'lucide-react'

export default function EmptyChat() {
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn">
      <div className="relative max-w-sm p-8 rounded-3xl border border-black/5 dark:border-white/5 bg-white/20 dark:bg-[#16181d]/30 backdrop-blur-xl shadow-xl shadow-black/[0.02] dark:shadow-black/20 flex flex-col items-center space-y-5 overflow-hidden">
        
        {/* Glow element */}
        <div className="absolute top-[-100px] left-[-100px] h-48 w-48 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-100px] right-[-100px] h-48 w-48 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20 dark:border-violet-500/30 text-violet-500 dark:text-violet-400 relative z-10 animate-bounce" style={{ animationDuration: '3s' }}>
          <MessageSquare className="h-6 w-6" />
        </div>

        <div className="space-y-1.5 relative z-10">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-white lowercase tracking-wide flex items-center justify-center gap-1.5">
            <span>start the conversation</span>
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          </h4>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            no messages yet. type a friendly message below to say hello!
          </p>
        </div>
      </div>
    </div>
  )
}
