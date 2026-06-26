import React from 'react'
import { Play, Pause } from 'lucide-react'
import { formatTime } from '@/lib/utils/time'

interface TimerPanelProps {
  displayIsNoTimer: boolean
  elapsedSeconds: number
  displayDurationMinutes: number
  isHost: boolean
  isActive: boolean
  handleToggleTimer: () => Promise<void>
  handleManualEndSession: () => Promise<void>
  progressPercent: number
  sessionTab: 'timer' | 'crew' | 'chat'
}

export default function TimerPanel({
  displayIsNoTimer,
  elapsedSeconds,
  displayDurationMinutes,
  isHost,
  isActive,
  handleToggleTimer,
  handleManualEndSession,
  progressPercent,
  sessionTab
}: TimerPanelProps) {
  if (sessionTab !== 'timer') return null

  return (
    <div className="lg:col-span-5 lg:flex lg:flex-col lg:justify-center p-6 gap-8 bg-black/25 dark:bg-white/[0.01] border border-white/5 rounded-3xl lg:h-[calc(100vh-10rem)] shadow-lg backdrop-blur-xl flex flex-col flex-1 items-center justify-center min-h-[350px]">
      <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full">
        {/* Circular Timer Display */}
        <div className="py-9 px-10 rounded-3xl bg-black/25 dark:bg-white/[0.02] border border-white/5 backdrop-blur-xl flex flex-col items-center justify-center relative min-w-[240px] shadow-lg">
          <svg className="absolute inset-0 w-full h-full p-2.5 pointer-events-none" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth="1.5" />
            <circle 
              cx="50" 
              cy="50" 
              r="46" 
              fill="transparent" 
              stroke="rgba(245, 158, 11, 0.4)" 
              strokeWidth="2.5" 
              strokeDasharray="289"
              strokeDashoffset={289 - (289 * progressPercent) / 100}
              className="transition-all duration-1000 origin-center -rotate-90"
            />
          </svg>

          <span className="text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            {displayIsNoTimer ? formatTime(elapsedSeconds) : formatTime(Math.max(0, (displayDurationMinutes * 60) - elapsedSeconds))}
          </span>
        </div>

        {/* Play/Pause Controls (Host) or Status Bar (Participants) */}
        <div className="w-full max-w-xs">
          {isHost ? (
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={handleToggleTimer}
                className={`flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-md h-12 border-none ${
                  isActive 
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20' 
                    : 'bg-white/10 hover:bg-white/15 border border-white/10 text-white'
                }`}
              >
                {isActive ? <Pause className="h-5 w-5 shrink-0" /> : <Play className="h-5 w-5 shrink-0" />}
                <span>{isActive ? 'pause' : 'resume'}</span>
              </button>

              <button
                onClick={handleManualEndSession}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-550/15 border border-emerald-550/30 hover:bg-emerald-550/20 text-emerald-400 text-xs font-black uppercase tracking-wider transition-all cursor-pointer h-12 border-none"
              >
                end session
              </button>
            </div>
          ) : (
            <div className="w-full py-3.5 rounded-2xl bg-black/20 dark:bg-white/[0.02] border border-white/5 text-gray-400 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 h-12">
              <span className={`h-2.5 w-2.5 rounded-full bg-emerald-500 ${isActive ? 'animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : ''}`} />
              <span>{isActive ? 'focusing with crew' : 'session paused by host'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
