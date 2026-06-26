import React from 'react'
import { AlertCircle } from 'lucide-react'

interface InviteModalProps {
  isInviteModalOpen: boolean
  setIsInviteModalOpen: (val: boolean) => void
  handleInviteContributor: (e: React.FormEvent) => void
  inviteName: string
  setInviteName: (val: string) => void
  inviteError: string | null
}

export default function InviteModal({
  isInviteModalOpen,
  setIsInviteModalOpen,
  handleInviteContributor,
  inviteName,
  setInviteName,
  inviteError
}: InviteModalProps) {
  if (!isInviteModalOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsInviteModalOpen(false)} />
      <div className="relative w-full max-w-sm bg-[#fefdfb] dark:bg-[#1c1f26] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl z-10 animate-scaleIn">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white lowercase border-b border-black/5 dark:border-white/5 pb-3">
          Invite Workspace Contributor
        </h3>

        <form onSubmit={handleInviteContributor} className="space-y-4 mt-4 text-xs font-semibold">
          <div>
            <label className="text-gray-400 block mb-1">Username</label>
            <input
              type="text"
              required
              placeholder="Enter crew username..."
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-violet-500/50"
              autoFocus
            />
            {inviteError && (
              <p className="text-[10px] text-rose-500 mt-1.5 font-sans font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{inviteError}</span>
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-black/5 dark:border-white/5 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(false)}
              className="px-4 py-2 bg-black/[0.03] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl text-gray-500 hover:bg-black/[0.05] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white border-transparent rounded-xl shadow-md cursor-pointer"
            >
              Add to Crew
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
