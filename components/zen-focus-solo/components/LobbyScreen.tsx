import React from 'react'
import { Clock, Sparkles } from 'lucide-react'

interface LobbyScreenProps {
  onOpenSession: () => void
}

export default function LobbyScreen({ onOpenSession }: LobbyScreenProps) {
  return (
    <div className="w-full max-w-md my-auto flex flex-col justify-center items-center z-10 animate-pageFadeIn">
      <div className="bg-neo-bg shadow-neo border border-white/5 p-8 rounded-[28px] w-full text-center space-y-6">
        <div className="h-16 w-16 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500 mx-auto">
          <Clock className="h-8 w-8 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-white lowercase">solo focus environment</h1>
          <p className="text-xs text-neo-secondary font-medium leading-relaxed">
            Welcome to Zen Focus, a completely private study space. Social feeds, team chats, notifications, and updates are entirely hidden to protect your deep concentration and keep you locked in a state of high flow.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={onOpenSession}
            className="w-full py-4 bg-violet-600 hover:bg-violet-750 text-white rounded-2xl text-xs font-black lowercase tracking-wide cursor-pointer transition-all duration-300 transform hover:scale-[1.01] active:translate-y-0.5 shadow-md flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>Open Solo Session</span>
          </button>
        </div>
      </div>
    </div>
  )
}
