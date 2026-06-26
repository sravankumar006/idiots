import React from 'react'
import { Palette } from 'lucide-react'

interface WorkspaceBannerProps {
  bannerUrl: string
  icon: string
  mood: string
  setIsCustomizingAppearance: (val: boolean) => void
  setIsCustomizingMood: (val: boolean) => void
}

export default function WorkspaceBanner({
  bannerUrl,
  icon,
  mood,
  setIsCustomizingAppearance,
  setIsCustomizingMood
}: WorkspaceBannerProps) {
  return (
    <div className="relative h-44 rounded-3xl overflow-hidden mb-6 border border-black/10 dark:border-white/10 group bg-slate-950/40">
      {bannerUrl ? (
        <img src={bannerUrl} alt="Workspace Banner" className="w-full h-full object-cover opacity-80" />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-violet-600/20 via-pink-600/10 to-indigo-600/20 animate-breathing" />
      )}

      {/* Quick theme actions button */}
      <button
        onClick={() => setIsCustomizingAppearance(true)}
        className="absolute top-4 right-4 py-2 px-3 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
      >
        <Palette className="h-4 w-4 text-violet-400" />
        <span>Customize Workspace Layout</span>
      </button>

      {/* Emoji / Mood floating customization */}
      <div className="absolute bottom-4 left-6 flex items-end gap-3.5">
        <button
          onClick={() => setIsCustomizingMood(true)}
          className="h-14 w-14 rounded-2xl bg-[#fefdfb] dark:bg-[#1a142a] border border-black/10 dark:border-white/10 flex items-center justify-center text-3xl shadow-xl hover:scale-105 transition-all cursor-pointer"
          title="Set workspace mood"
        >
          {icon}
        </button>
        <div className="mb-1 bg-black/60 backdrop-blur-md border border-white/5 py-1 px-3.5 rounded-full">
          <span className="text-[10px] uppercase tracking-widest text-gray-400 font-extrabold">current mood</span>
          <p className="text-xs font-black text-white capitalize mt-0.5">{mood}</p>
        </div>
      </div>
    </div>
  )
}
