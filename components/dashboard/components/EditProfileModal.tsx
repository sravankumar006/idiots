import React from 'react'
import { X } from 'lucide-react'

interface EditProfileModalProps {
  dreamCompany: string
  setDreamCompany: (val: string) => void
  favoriteLanguage: string
  setFavoriteLanguage: (val: string) => void
  techStackInput: string
  setTechStackInput: (val: string) => void
  goalsInput: string
  setGoalsInput: (val: string) => void
  certificationsInput: string
  setCertificationsInput: (val: string) => void
  resumeUrl: string
  setResumeUrl: (val: string) => void
  portfolioUrl: string
  setPortfolioUrl: (val: string) => void
  handleSaveProfile: (e: React.FormEvent) => Promise<void>
  onClose: () => void
}

export default function EditProfileModal({
  dreamCompany,
  setDreamCompany,
  favoriteLanguage,
  setFavoriteLanguage,
  techStackInput,
  setTechStackInput,
  goalsInput,
  setGoalsInput,
  certificationsInput,
  setCertificationsInput,
  resumeUrl,
  setResumeUrl,
  portfolioUrl,
  setPortfolioUrl,
  handleSaveProfile,
  onClose
}: EditProfileModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#fefdfb] dark:bg-[#1c1f26] border border-black/10 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-base font-extrabold text-gray-900 dark:text-white lowercase border-b border-black/5 dark:border-white/5 pb-3">
          edit profile summary
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4 mt-4 text-xs font-semibold">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 block mb-1">Target Company</label>
              <input
                type="text"
                value={dreamCompany}
                onChange={(e) => setDreamCompany(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="text-gray-400 block mb-1">Favorite Lang</label>
              <input
                type="text"
                value={favoriteLanguage}
                onChange={(e) => setFavoriteLanguage(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-400 block mb-1">Tech Stack (comma separated)</label>
            <input
              type="text"
              value={techStackInput}
              onChange={(e) => setTechStackInput(e.target.value)}
              placeholder="React, TypeScript, Next.js, Node.js"
              className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>

          <div>
            <label className="text-gray-400 block mb-1">Target Goals (comma separated)</label>
            <input
              type="text"
              value={goalsInput}
              onChange={(e) => setGoalsInput(e.target.value)}
              placeholder="Solve 300 DSA problems, Polish LinkedIn"
              className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>

          <div>
            <label className="text-gray-400 block mb-1">Certifications (comma separated)</label>
            <input
              type="text"
              value={certificationsInput}
              onChange={(e) => setCertificationsInput(e.target.value)}
              placeholder="AWS Solutions Architect, Google Cloud Developer"
              className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 block mb-1">Resume Link</label>
              <input
                type="url"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="text-gray-400 block mb-1">Portfolio Link</label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://myportfolio.space"
                className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-black/5 dark:border-white/5 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-black/[0.03] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl text-gray-500 hover:bg-black/[0.05] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white border-transparent rounded-xl shadow-md cursor-pointer"
            >
              Save Summary
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
