import React from 'react'
import { Check } from 'lucide-react'
import { ACCENT_COLORS, BANNER_PRESETS } from '../utils/creative-room.utils'

interface CustomizationModalProps {
  isCustomizingAppearance: boolean
  setIsCustomizingAppearance: (val: boolean) => void
  accentColor: string
  handleSelectAccent: (hex: string) => void
  handleSelectBannerPreset: (url: string) => void
  customBannerUrlInput: string
  setCustomBannerUrlInput: (val: string) => void
  handleSelectCustomBanner: () => void
}

export default function CustomizationModal({
  isCustomizingAppearance,
  setIsCustomizingAppearance,
  accentColor,
  handleSelectAccent,
  handleSelectBannerPreset,
  customBannerUrlInput,
  setCustomBannerUrlInput,
  handleSelectCustomBanner
}: CustomizationModalProps) {
  if (!isCustomizingAppearance) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCustomizingAppearance(false)} />
      <div className="relative w-full max-w-lg bg-[#fefdfb] dark:bg-[#1c1f26] border border-black/10 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleIn max-h-[90vh] overflow-y-auto scrollbar-thin">
        <h3 className="text-base font-extrabold text-gray-900 dark:text-white lowercase border-b border-black/5 dark:border-white/5 pb-3">
          Customize Workspace Theme & Banner
        </h3>

        <div className="space-y-5 mt-4 text-xs font-semibold">
          {/* Accent Colors */}
          <div>
            <label className="text-gray-400 block mb-2">Accent Style Color</label>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map(c => (
                <button
                  key={c.hex}
                  onClick={() => handleSelectAccent(c.hex)}
                  className={`h-7 px-3 rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5 cursor-pointer ${c.bg} ${accentColor === c.hex ? 'ring-2 ring-white ring-offset-2' : ''}`}
                  title={c.name}
                >
                  {accentColor === c.hex && <Check className="h-3 w-3" />}
                  <span>{c.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Banner Presets */}
          <div>
            <label className="text-gray-400 block mb-2">Banner Presets</label>
            <div className="grid grid-cols-2 gap-2">
              {BANNER_PRESETS.map(b => (
                <button
                  key={b.name}
                  onClick={() => handleSelectBannerPreset(b.url)}
                  className={`relative h-16 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 text-left p-2 cursor-pointer group hover:scale-[1.01] transition-all`}
                >
                  <img src={b.url} alt={b.name} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-all" />
                  <span className="absolute bottom-1 left-2 bg-black/60 py-0.5 px-2 rounded-md text-[9px] font-bold text-white">{b.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom URL Input */}
          <div>
            <label className="text-gray-400 block mb-1">Custom Banner Image URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={customBannerUrlInput}
                onChange={(e) => setCustomBannerUrlInput(e.target.value)}
                className="flex-1 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
              />
              <button
                type="button"
                onClick={handleSelectCustomBanner}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
