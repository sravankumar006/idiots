import React from 'react'
import { CheckCircle2 } from 'lucide-react'

interface ReflectionModalProps {
  showCompletionModal: boolean
  accomplishments: string
  setAccomplishments: (val: string) => void
  reflectionRating: number
  setReflectionRating: (val: number) => void
  reflections: string
  setReflections: (val: string) => void
  isSubmitting: boolean
  handleAbandonSession: () => Promise<void>
  handleSaveCompletion: () => Promise<void>
}

export default function ReflectionModal({
  showCompletionModal,
  accomplishments,
  setAccomplishments,
  reflectionRating,
  setReflectionRating,
  reflections,
  setReflections,
  isSubmitting,
  handleAbandonSession,
  handleSaveCompletion
}: ReflectionModalProps) {
  if (!showCompletionModal) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <div className="relative w-full max-w-sm bg-[#fdfbf7] dark:bg-[#12141a] border border-black/10 dark:border-white/10 rounded-3xl p-5 shadow-2xl z-10 animate-scaleIn">
        <h3 className="text-sm font-black text-gray-900 dark:text-white lowercase border-b border-black/5 dark:border-white/5 pb-2.5">
          reflect & catalog focus cycle
        </h3>

        <div className="space-y-3.5 mt-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
          <div className="space-y-1">
            <label className="text-gray-400 block text-[10px] uppercase font-bold tracking-wide pl-0.5">what did you accomplish?</label>
            <input
              type="text"
              required
              value={accomplishments}
              onChange={(e) => setAccomplishments(e.target.value)}
              placeholder="e.g. read study papers, completed task updates..."
              className="w-full bg-black/5 dark:bg-white/5 border border-black/8 dark:border-white/8 rounded-xl px-3.5 py-3 text-xs text-gray-805 dark:text-white focus:outline-none focus:border-amber-500/50 h-11"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-gray-400 text-[10px] uppercase font-bold tracking-wide pl-0.5">
              <label>focus intensity rating</label>
              <span className="text-amber-500 font-black text-xs">{reflectionRating}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={reflectionRating}
              onChange={(e) => setReflectionRating(parseInt(e.target.value))}
              className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 block text-[10px] uppercase font-bold tracking-wide pl-0.5">general notes & thoughts</label>
            <textarea
              value={reflections}
              onChange={(e) => setReflections(e.target.value)}
              placeholder="any roadblocks or achievements during this cycle..."
              className="w-full bg-black/5 dark:bg-white/5 border border-black/8 dark:border-white/8 rounded-xl p-3 text-xs text-gray-805 dark:text-white focus:outline-none focus:border-amber-500/50 resize-none h-16 leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-black/5 dark:border-white/5 flex justify-end gap-2 h-12">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleAbandonSession}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-405 rounded-xl cursor-pointer disabled:opacity-50 text-xs font-bold border-none"
            >
              discard
            </button>
            <button
              type="button"
              disabled={isSubmitting || !accomplishments.trim()}
              onClick={handleSaveCompletion}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold border-none"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{isSubmitting ? 'saving...' : 'save cycle'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
