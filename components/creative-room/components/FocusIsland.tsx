import React from 'react'
import { Pause, Play, Maximize2, ChevronDown, Plus, Square } from 'lucide-react'

interface FocusIslandProps {
  isFocusModalOpen: boolean
  setIsFocusModalOpen: (val: boolean) => void
  islandSize: 'compact' | 'expanded'
  setIsIslandSize: (val: 'compact' | 'expanded') => void
  islandPosition: { x: number; y: number }
  isDragging: boolean
  handleMouseDown: (e: React.MouseEvent) => void
  handleTouchStart: (e: React.TouchEvent) => void
  focusTimeRemaining: number
  isFocusActive: boolean
  handlePauseFocusSession: () => void
  handleStartFocusSession: () => void
  focusGoal: string
  setFocusGoal: (val: string) => void
  focusDuration: number
  setFocusDuration: (val: number) => void
  handleStopFocusSession: () => void
}

export default function FocusIsland({
  isFocusModalOpen,
  setIsFocusModalOpen,
  islandSize,
  setIsIslandSize,
  islandPosition,
  isDragging,
  handleMouseDown,
  handleTouchStart,
  focusTimeRemaining,
  isFocusActive,
  handlePauseFocusSession,
  handleStartFocusSession,
  focusGoal,
  setFocusGoal,
  focusDuration,
  setFocusDuration,
  handleStopFocusSession
}: FocusIslandProps) {
  if (!isFocusModalOpen) return null

  return (
    <div
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        transform: `translate(${islandPosition.x}px, ${islandPosition.y}px)`,
        transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)'
      }}
      className={`fixed bottom-6 right-6 z-50 select-none cursor-grab active:cursor-grabbing backdrop-blur-xl border border-violet-500/20 shadow-[0_15px_40px_rgba(124,58,237,0.25)] dark:bg-[#120e1e]/90 bg-[#faf8f5]/95 text-center transition-all ${
        islandSize === 'compact' 
          ? 'w-48 h-12 rounded-full px-3 py-1 flex items-center justify-between gap-1.5' 
          : 'w-72 rounded-[28px] p-5 flex flex-col gap-3.5'
      }`}
    >
      {/* COMPACT PILL MODE */}
      {islandSize === 'compact' && (
        <>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${isFocusActive ? 'bg-purple-500 animate-ping' : 'bg-amber-500'}`} />
            <span className="font-mono text-xs font-bold text-gray-800 dark:text-white">
              {Math.floor(focusTimeRemaining / 60)}:{(focusTimeRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            {isFocusActive ? (
              <button
                onClick={handlePauseFocusSession}
                className="p-1 text-amber-500 hover:bg-amber-500/10 rounded-full cursor-pointer"
                title="Pause focus"
              >
                <Pause className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={handleStartFocusSession}
                className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-full cursor-pointer"
                title="Resume focus"
              >
                <Play className="h-3.5 w-3.5" />
              </button>
            )}
            
            <button
              onClick={() => setIsIslandSize('expanded')}
              className="p-1 text-gray-400 hover:text-gray-800 dark:hover:text-white rounded-full cursor-pointer"
              title="Expand controls"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}

      {/* EXPANDED PANEL MODE */}
      {islandSize === 'expanded' && (
        <>
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-violet-400 uppercase tracking-widest font-black">Focus Island</span>
              {isFocusActive && <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsIslandSize('compact')}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                title="Contract to capsule"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsFocusModalOpen(false)}
                className="p-1 text-gray-400 hover:text-rose-500 cursor-pointer"
                title="Close focus mode"
              >
                <Plus className="h-4 w-4 rotate-45" />
              </button>
            </div>
          </div>

          {!isFocusActive && focusTimeRemaining === 0 ? (
            <div className="space-y-3.5 text-left text-xs font-semibold">
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold block mb-1">Focus Target Goal</label>
                <input
                  type="text"
                  placeholder="e.g. Debug WebSocket presence..."
                  value={focusGoal}
                  onChange={(e) => setFocusGoal(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3 py-2 text-xs text-gray-855 dark:text-white focus:outline-none"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold block mb-1.5">Duration</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[10, 25, 50].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setFocusDuration(mins)}
                      className={`py-1.5 rounded-xl font-bold cursor-pointer text-center text-[10px] ${
                        focusDuration === mins 
                          ? 'bg-violet-600 border-transparent text-white shadow-md' 
                          : 'bg-black/5 dark:bg-white/5 border-transparent hover:bg-black/10'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartFocusSession}
                className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md mt-2"
              >
                Start Focus Session
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] text-gray-400 font-bold block capitalize">target: {focusGoal || 'Workspace Tasks'}</span>
                <h1 className="text-3xl font-black font-mono text-gray-900 dark:text-white tracking-widest">
                  {Math.floor(focusTimeRemaining / 60)}:{(focusTimeRemaining % 60).toString().padStart(2, '0')}
                </h1>
              </div>

              <div className="flex justify-center gap-2">
                {isFocusActive ? (
                  <button
                    onClick={handlePauseFocusSession}
                    className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-full cursor-pointer transition-all border border-amber-500/20"
                    title="Pause"
                  >
                    <Pause className="h-4.5 w-4.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleStartFocusSession}
                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-full cursor-pointer transition-all border border-emerald-500/20"
                    title="Resume"
                  >
                    <Play className="h-4.5 w-4.5" />
                  </button>
                )}

                <button
                  onClick={handleStopFocusSession}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-full cursor-pointer transition-all border border-rose-500/20"
                  title="Stop"
                >
                  <Square className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
