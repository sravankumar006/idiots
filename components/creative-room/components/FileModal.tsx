import React from 'react'
import { AlertCircle } from 'lucide-react'

interface FileModalProps {
  isNewFileModalOpen: boolean
  setIsNewFileModalOpen: (val: boolean) => void
  handleCreateFile: (e: React.FormEvent) => void
  newFileName: string
  setNewFileName: (val: string) => void
  newFileError: string | null
}

export default function FileModal({
  isNewFileModalOpen,
  setIsNewFileModalOpen,
  handleCreateFile,
  newFileName,
  setNewFileName,
  newFileError
}: FileModalProps) {
  if (!isNewFileModalOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNewFileModalOpen(false)} />
      <div className="relative w-full max-w-md bg-[#fefdfb] dark:bg-[#1c1f26] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl z-10 animate-scaleIn">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white lowercase border-b border-black/5 dark:border-white/5 pb-3">
          create workspace file
        </h3>

        <form onSubmit={handleCreateFile} className="space-y-4 mt-4 text-xs font-semibold">
          <div>
            <label className="text-gray-400 block mb-1">File Name (include extension)</label>
            <input
              type="text"
              required
              placeholder="e.g. app.js, main.py, styles.css"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50 font-mono"
              autoFocus
            />
            {newFileError && (
              <p className="text-[10px] text-rose-500 mt-1.5 font-sans font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{newFileError}</span>
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-black/5 dark:border-white/5 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsNewFileModalOpen(false)}
              className="px-4 py-2 bg-black/[0.03] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl text-gray-500 hover:bg-black/[0.05] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white border-transparent rounded-xl shadow-md cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
