import React from 'react'
import Link from 'next/link'
import { ArrowRight, Settings2 } from 'lucide-react'
import { UserProfile } from '@/types'
import { WALLPAPERS, WallpaperConfig } from '../types/space-profile.types'

interface SpaceHeaderProps {
  spaceData: {
    profile_banner: string
    current_status: string
    profile_wallpaper: string
  }
  targetProfile: UserProfile | null
  latestMood: {
    mood_label: string
  } | null
  isReadOnly: boolean
  openConfigModal: () => void
}

export default function SpaceHeader({
  spaceData,
  targetProfile,
  latestMood,
  isReadOnly,
  openConfigModal
}: SpaceHeaderProps) {
  const activeWallpaper = WALLPAPERS.find(w => w.id === spaceData.profile_wallpaper) || WALLPAPERS[0]

  return (
    <>
      {/* Banner Graphic Header */}
      {spaceData.profile_banner && (
        <div className="w-full h-32 md:h-44 rounded-3xl overflow-hidden border border-white/10 mb-6 relative">
          <img src={spaceData.profile_banner} alt="space header banner" className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}
      
      {/* Navigation / space information header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-panel border-none p-4 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className={`h-11 w-11 rounded-full bg-gradient-to-tr from-violet-500 to-rose-400 flex items-center justify-center shadow-lg font-bold text-black text-sm`}>
            {targetProfile?.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-gray-900 dark:text-white lowercase">
                {targetProfile?.username}'s corner
              </h2>
              {spaceData.current_status && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-500 dark:text-gray-400 font-bold">
                  💬 {spaceData.current_status}
                </span>
              )}
              {latestMood && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 font-bold">
                  mood: {latestMood.mood_label}
                </span>
              )}
            </div>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">
              personal digital room • {activeWallpaper.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link 
            href={`/dashboard?userId=${targetProfile?.id}`}
            className="py-2 px-3.5 rounded-xl bg-white/5 border border-white/5 text-[11px] font-bold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer text-decoration-none"
          >
            <span>View Career Hub</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          
          {!isReadOnly && (
            <button
              onClick={openConfigModal}
              className="py-2 px-3.5 rounded-xl bg-neo-bg shadow-neo border-none text-[11px] font-bold text-[#5E4545] dark:text-[#ffb4b4] hover:shadow-neo hover:-translate-y-0.5 active:shadow-neo-inset active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span>Room Settings</span>
            </button>
          )}
        </div>
      </div>
    </>
  )
}
