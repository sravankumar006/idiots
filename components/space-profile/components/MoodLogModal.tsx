import React from 'react'

interface MoodLogModalProps {
  showMoodLog: boolean
  setShowMoodLog: (val: boolean) => void
  newMood: number
  setNewMood: (val: number) => void
  newEnergy: number
  setNewEnergy: (val: number) => void
  newFocus: number
  setNewFocus: (val: number) => void
  newStatus: string
  setNewStatus: (val: string) => void
  handleSaveMood: (e: React.FormEvent) => Promise<void>
}

export default function MoodLogModal({
  showMoodLog,
  setShowMoodLog,
  newMood,
  setNewMood,
  newEnergy,
  setNewEnergy,
  newFocus,
  setNewFocus,
  newStatus,
  setNewStatus,
  handleSaveMood
}: MoodLogModalProps) {
  if (!showMoodLog) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowMoodLog(false)} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-[#141520] border border-black/10 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleIn text-xs font-bold text-gray-700 dark:text-gray-300">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white lowercase border-b border-white/5 pb-3">
          how are you feeling? check in with the node.
        </h3>

        <form onSubmit={handleSaveMood} className="space-y-5 mt-5">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <label htmlFor="mood-rating-range" className="text-gray-500 dark:text-gray-400">Mood Index: {newMood * 10}/100</label>
              <span className="text-rose-400 font-semibold">
                {newMood <= 3 ? '😔 Low' : newMood <= 5 ? '😕 Tired' : newMood <= 7 ? '😐 Okay' : newMood <= 9 ? '🙂 Good' : '😀 Great'}
              </span>
            </div>
            <input
              id="mood-rating-range"
              type="range"
              min="1"
              max="10"
              value={newMood}
              onChange={(e) => setNewMood(parseInt(e.target.value))}
              className="w-full accent-rose-500 h-1.5 rounded-full cursor-pointer bg-white/10"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <label htmlFor="energy-level-range" className="text-gray-500 dark:text-gray-400">Energy Level: {newEnergy}/10</label>
              <span className="text-amber-400 font-semibold">{newEnergy <= 4 ? 'Tired / Drained' : newEnergy <= 7 ? 'Balanced' : 'Energized'}</span>
            </div>
            <input
              id="energy-level-range"
              type="range"
              min="1"
              max="10"
              value={newEnergy}
              onChange={(e) => setNewEnergy(parseInt(e.target.value))}
              className="w-full accent-amber-500 h-1.5 rounded-full cursor-pointer bg-white/10"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <label htmlFor="focus-index-range" className="text-gray-500 dark:text-gray-400">Focus Index: {newFocus}/10</label>
              <span className="text-violet-400 font-semibold">{newFocus <= 4 ? 'Distracted' : newFocus <= 7 ? 'Studying / Flow' : 'Absolute Deep Focus'}</span>
            </div>
            <input
              id="focus-index-range"
              type="range"
              min="1"
              max="10"
              value={newFocus}
              onChange={(e) => setNewFocus(parseInt(e.target.value))}
              className="w-full accent-violet-500 h-1.5 rounded-full cursor-pointer bg-white/10"
            />
          </div>

          <div>
            <label htmlFor="thought-status-input" className="text-gray-500 dark:text-gray-400 block mb-1.5">What is on your mind? (Status description)</label>
            <input
              id="thought-status-input"
              type="text"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              placeholder="e.g. debugging Next.js middlewares until midnight..."
              className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-955 dark:text-white focus:outline-none focus:border-violet-500/50 font-semibold"
            />
          </div>

          <div className="pt-3 border-t border-white/5 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowMoodLog(false)}
              className="px-4 py-2 bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-gray-550 hover:bg-white/10 cursor-pointer text-xs font-bold font-sans"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-650 bg-rose-600 hover:bg-rose-500 text-gray-955 dark:text-white border-transparent rounded-xl shadow-md cursor-pointer text-xs font-bold font-sans"
            >
              Record Log checkin
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
