import React from 'react'
import { AVAILABLE_MOODS } from '../utils/creative-room.utils'

interface MoodSelectorModalProps {
  isCustomizingMood: boolean
  setIsCustomizingMood: (val: boolean) => void
  handleSelectMood: (mood: string, emoji: string) => void
}

export default function MoodSelectorModal({
  isCustomizingMood,
  setIsCustomizingMood,
  handleSelectMood
}: MoodSelectorModalProps) {
  if (!isCustomizingMood) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCustomizingMood(false)} />
      <div className="relative w-full max-w-sm bg-[#fefdfb] dark:bg-[#1c1f26] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl z-10 animate-scaleIn">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white lowercase border-b border-black/5 dark:border-white/5 pb-3">
          Select Workspace Mood
        </h3>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {AVAILABLE_MOODS.map(m => (
            <button
              key={m.label}
              onClick={() => handleSelectMood(m.label, m.emoji)}
              className="p-3 bg-black/5 dark:bg-white/5 hover:bg-violet-600/10 hover:text-violet-500 rounded-xl text-left text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border border-transparent hover:border-violet-500/20"
            >
              <span className="text-xl">{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
