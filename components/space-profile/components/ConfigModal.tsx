import React from 'react'
import { THEMES, WALLPAPERS } from '../types/space-profile.types'

interface ConfigModalProps {
  showConfig: boolean
  setShowConfig: (val: boolean) => void
  editingThemeColor: string
  setEditingThemeColor: (val: string) => void
  editingWallpaper: string
  setEditingWallpaper: (val: string) => void
  editingAccents: string
  setEditingAccents: (val: string) => void
  editingStatus: string
  setEditingStatus: (val: string) => void
  editingBanner: string
  setEditingBanner: (val: string) => void
  editingBio: string
  setEditingBio: (val: string) => void
  editingGithub: string
  setEditingGithub: (val: string) => void
  editingLinkedin: string
  setEditingLinkedin: (val: string) => void
  editingPortfolio: string
  setEditingPortfolio: (val: string) => void
  editingResume: string
  setEditingResume: (val: string) => void
  editingMission: string
  setEditingMission: (val: string) => void
  editingProgress: number
  setEditingProgress: (val: number) => void
  handleSaveConfig: (e: React.FormEvent) => Promise<void>
}

export default function ConfigModal({
  showConfig,
  setShowConfig,
  editingThemeColor,
  setEditingThemeColor,
  editingWallpaper,
  setEditingWallpaper,
  editingAccents,
  setEditingAccents,
  editingStatus,
  setEditingStatus,
  editingBanner,
  setEditingBanner,
  editingBio,
  setEditingBio,
  editingGithub,
  setEditingGithub,
  editingLinkedin,
  setEditingLinkedin,
  editingPortfolio,
  setEditingPortfolio,
  editingResume,
  setEditingResume,
  editingMission,
  setEditingMission,
  editingProgress,
  setEditingProgress,
  handleSaveConfig
}: ConfigModalProps) {
  if (!showConfig) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConfig(false)} />
      
      <div className="relative w-full max-w-lg glass-panel border-none rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleIn text-xs font-bold max-h-[90vh] overflow-y-auto">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white lowercase border-b border-black/5 pb-3 flex items-center justify-between">
          <span>Configure Profile & Identity</span>
          <button type="button" onClick={() => setShowConfig(false)} className="text-gray-450 hover:text-gray-600 dark:hover:text-white border-none bg-transparent cursor-pointer text-sm font-bold">✕</button>
        </h3>

        <form onSubmit={handleSaveConfig} className="space-y-4 mt-4 text-gray-700 dark:text-gray-300">
          
          {/* 1. APPEARANCE SETTINGS */}
          <span className="text-[9px] uppercase tracking-widest text-violet-400 font-extrabold block border-b border-white/5 pb-1">Appearance Settings</span>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="theme-select" className="text-gray-550 dark:text-gray-400 block mb-1">Theme Accent Color</label>
              <select
                id="theme-select"
                value={editingThemeColor}
                onChange={(e) => setEditingThemeColor(e.target.value)}
                className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none"
              >
                {Object.keys(THEMES).map(k => (
                  <option key={k} value={k} className="bg-white dark:bg-[#141520]">{THEMES[k].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="wallpaper-select" className="text-gray-550 dark:text-gray-400 block mb-1">Preset Wallpaper</label>
              <select
                id="wallpaper-select"
                value={editingWallpaper}
                onChange={(e) => setEditingWallpaper(e.target.value)}
                className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none"
              >
                {WALLPAPERS.map(w => (
                  <option key={w.id} value={w.id} className="bg-white dark:bg-[#141520]">{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="accents-select" className="text-gray-550 dark:text-gray-400 block mb-1">Profile Accents (Visual Effects)</label>
              <select
                id="accents-select"
                value={editingAccents}
                onChange={(e) => setEditingAccents(e.target.value)}
                className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="none" className="bg-white dark:bg-[#141520]">None</option>
                <option value="stars" className="bg-white dark:bg-[#141520]">Star Sparkles 🌌</option>
                <option value="bubbles" className="bg-white dark:bg-[#141520]">Floating Bubbles 🫧</option>
                <option value="neon" className="bg-white dark:bg-[#141520]">Neon Pulsing Border ⚡</option>
              </select>
            </div>
            <div>
              <label htmlFor="status-input" className="text-gray-550 dark:text-gray-400 block mb-1">Current status text</label>
              <input
                id="status-input"
                type="text"
                value={editingStatus}
                onChange={(e) => setEditingStatus(e.target.value)}
                placeholder="e.g. coding 3am..."
                className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-950 dark:text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="banner-input" className="text-gray-550 dark:text-gray-400 block mb-1">Profile Banner Image URL (Optional)</label>
            <input
              id="banner-input"
              type="url"
              value={editingBanner}
              onChange={(e) => setEditingBanner(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-950 dark:text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>

          {/* 2. IDENTITY & SOCIAL LINKS */}
          <span className="text-[9px] uppercase tracking-widest text-violet-400 font-extrabold block border-b border-white/5 pt-2 pb-1">Professional Identity</span>
          
          <div>
            <label htmlFor="bio-input" className="text-gray-550 dark:text-gray-400 block mb-1">Bio Description</label>
            <textarea
              id="bio-input"
              value={editingBio}
              onChange={(e) => setEditingBio(e.target.value)}
              placeholder="Tell visitors about yourself, your interests, and what you study..."
              className="w-full h-20 bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-950 dark:text-white focus:outline-none focus:border-violet-500/50 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="github-input" className="text-gray-550 dark:text-gray-400 block mb-1">GitHub Username</label>
              <input
                id="github-input"
                type="text"
                value={editingGithub}
                onChange={(e) => setEditingGithub(e.target.value)}
                placeholder="e.g. sravankumar006"
                className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-955 dark:text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label htmlFor="linkedin-input" className="text-gray-550 dark:text-gray-400 block mb-1">LinkedIn URL</label>
              <input
                id="linkedin-input"
                type="url"
                value={editingLinkedin}
                onChange={(e) => setEditingLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-955 dark:text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="portfolio-input" className="text-gray-550 dark:text-gray-400 block mb-1">Portfolio URL</label>
              <input
                id="portfolio-input"
                type="url"
                value={editingPortfolio}
                onChange={(e) => setEditingPortfolio(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-955 dark:text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label htmlFor="resume-input" className="text-gray-550 dark:text-gray-400 block mb-1">Resume URL</label>
              <input
                id="resume-input"
                type="url"
                value={editingResume}
                onChange={(e) => setEditingResume(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-955 dark:text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>

          {/* 3. CURRENT MISSION SETTINGS */}
          <span className="text-[9px] uppercase tracking-widest text-violet-400 font-extrabold block border-b border-white/5 pt-2 pb-1">Current Mission Tracker</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="mission-input" className="text-gray-550 dark:text-gray-400 block mb-1">Mission Objective</label>
              <input
                id="mission-input"
                type="text"
                value={editingMission}
                onChange={(e) => setEditingMission(e.target.value)}
                placeholder="e.g. Build collaborative design systems..."
                className="w-full bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-gray-955 dark:text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label htmlFor="progress-input" className="text-gray-550 dark:text-gray-400 block mb-1 font-sans">Progress: {editingProgress}%</label>
              <input
                id="progress-input"
                type="range"
                min="0"
                max="100"
                value={editingProgress}
                onChange={(e) => setEditingProgress(Number(e.target.value))}
                className="w-full accent-violet-500 h-2 bg-white/10 rounded-full cursor-pointer mt-3"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowConfig(false)}
              className="px-4 py-2 bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-gray-550 hover:bg-white/10 cursor-pointer text-xs font-bold font-sans"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-violet-650 bg-violet-600 hover:bg-violet-500 text-gray-955 dark:text-white border-transparent rounded-xl shadow-md cursor-pointer text-xs font-bold font-sans"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
