import React from 'react'
import { Play, Pause, RotateCcw, Sparkles, Award } from 'lucide-react'
import { TimerStatus } from '../types/zen-focus-solo.types'

interface ControlDeckProps {
  timerStatus: TimerStatus
  timeLeft: number
  startFocusSession: () => void
  pauseFocusSession: () => void
  resumeFocusSession: () => void
  handleEndSessionEarly: () => void
  resetToSetup: () => void
}

export default function ControlDeck({
  timerStatus,
  timeLeft,
  startFocusSession,
  pauseFocusSession,
  resumeFocusSession,
  handleEndSessionEarly,
  resetToSetup
}: ControlDeckProps) {
  return (
    <div className="w-full pb-6">
      {timerStatus === 'idle' && (
        <button
          onClick={startFocusSession}
          disabled={timeLeft <= 0}
          className="w-full py-4 bg-violet-600 hover:bg-violet-750 text-white rounded-2xl text-xs font-black lowercase tracking-wide cursor-pointer transition-all duration-300 transform hover:scale-[1.01] active:translate-y-0.5 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Play className="h-4 w-4 fill-white" />
          <span>Start Focus Session</span>
        </button>
      )}

      {timerStatus === 'running' && (
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={pauseFocusSession}
            className="py-4 bg-white/10 hover:bg-white/15 text-white rounded-2xl text-xs font-black lowercase tracking-wide cursor-pointer transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Pause className="h-4 w-4 fill-white" />
            <span>Pause</span>
          </button>
          <button
            onClick={handleEndSessionEarly}
            className="py-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 rounded-2xl text-xs font-black lowercase tracking-wide cursor-pointer transition-all duration-300 flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>End Session</span>
          </button>
        </div>
      )}

      {timerStatus === 'paused' && (
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={resumeFocusSession}
            className="py-4 bg-violet-600 hover:bg-violet-750 text-white rounded-2xl text-xs font-black lowercase tracking-wide cursor-pointer transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>Resume</span>
          </button>
          <button
            onClick={handleEndSessionEarly}
            className="py-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 rounded-2xl text-xs font-black lowercase tracking-wide cursor-pointer transition-all duration-300 flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>End Session</span>
          </button>
        </div>
      )}

      {timerStatus === 'completed' && (
        <div className="space-y-3 w-full">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 animate-fadeIn">
            <div className="h-9 w-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white lowercase">session accomplished</h4>
              <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                Excellent focus! Today&apos;s records have been synchronization updated.
              </p>
            </div>
          </div>

          <button
            onClick={resetToSetup}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black lowercase tracking-wide cursor-pointer transition-all duration-300 transform hover:scale-[1.01] active:translate-y-0.5 shadow-md flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>New Focus Session</span>
          </button>
        </div>
      )}
    </div>
  )
}
