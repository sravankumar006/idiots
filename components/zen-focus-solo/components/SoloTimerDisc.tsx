import React from 'react'
import { TimerStatus } from '../types/zen-focus-solo.types'
import { formatClockTime } from '../utils/zen-focus-solo.utils'

interface SoloTimerDiscProps {
  timeLeft: number
  timerStatus: TimerStatus
  totalSessionSeconds: number
  durationMinutes: number
  customMinutes: string
  isCustomDuration: boolean
  setDurationMinutes: (mins: number) => void
  setCustomMinutes: (mins: string) => void
  setIsCustomDuration: (val: boolean) => void
}

const PRESETS = [25, 45, 60, 90]

export default function SoloTimerDisc({
  timeLeft,
  timerStatus,
  totalSessionSeconds,
  durationMinutes,
  customMinutes,
  isCustomDuration,
  setDurationMinutes,
  setCustomMinutes,
  setIsCustomDuration
}: SoloTimerDiscProps) {
  const radius = 110
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = totalSessionSeconds > 0
    ? circumference * (1 - timeLeft / totalSessionSeconds)
    : 0

  return (
    <div className="flex flex-col items-center justify-center py-6 relative my-auto">
      {/* Circular Countdown Ring */}
      <div className="relative flex items-center justify-center">
        <svg width="240" height="240" className="transform -rotate-90">
          {/* Background track circle */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            stroke="#1c1d26"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active progress ring */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            stroke={
              timerStatus === 'completed'
                ? 'var(--accent-cool)'
                : timerStatus === 'paused'
                ? 'var(--accent-warm)'
                : 'var(--neo-purple)'
            }
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* Timer clock inside circle */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold font-mono text-white tracking-wider">
            {formatClockTime(timeLeft)}
          </span>
          <span className="text-[10px] text-neo-secondary font-black uppercase tracking-widest mt-1">
            {timerStatus}
          </span>
        </div>
      </div>

      {/* Presets and Custom Inputs */}
      <div className="w-full mt-6 space-y-4">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {PRESETS.map((preset) => {
            const isSelected = !isCustomDuration && durationMinutes === preset
            return (
              <button
                key={preset}
                disabled={timerStatus !== 'idle'}
                onClick={() => {
                  setIsCustomDuration(false)
                  setDurationMinutes(preset)
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-50'
                }`}
              >
                {preset}m
              </button>
            )
          })}
          <button
            disabled={timerStatus !== 'idle'}
            onClick={() => setIsCustomDuration(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isCustomDuration
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-50'
            }`}
          >
            Custom
          </button>
        </div>

        {/* Custom Duration Input */}
        {isCustomDuration && timerStatus === 'idle' && (
          <div className="flex items-center gap-2 w-full max-w-[200px] mx-auto animate-fadeIn">
            <input
              type="number"
              min="1"
              max="1440"
              placeholder="Mins"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="glass-input text-center rounded-xl py-2 px-3 text-xs font-bold w-full text-white placeholder:text-gray-600 focus:outline-none"
            />
            <span className="text-xs text-gray-500 font-bold">mins</span>
          </div>
        )}
      </div>
    </div>
  )
}
