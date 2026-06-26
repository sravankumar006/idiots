import React from 'react'
import { Card } from '@/components/ui/Card'
import { StudyRoomInvitation } from '../types/dashboard.types'

interface PendingInvitationsProps {
  pendingInvitations: StudyRoomInvitation[]
  handleDeclineInvite: (id: string) => Promise<void>
  handleAcceptInvite: (invite: StudyRoomInvitation) => Promise<void>
  avatarMap: Record<string, { gradient: string; symbol: string }>
}

export default function PendingInvitations({
  pendingInvitations,
  handleDeclineInvite,
  handleAcceptInvite,
  avatarMap
}: PendingInvitationsProps) {
  if (pendingInvitations.length === 0) return null

  return (
    <div className="mb-6 space-y-4">
      <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-widest pl-1">
        study cabin invitations
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pendingInvitations.map((invite) => {
          const roomInfo = invite.study_rooms
          const hostProfile = invite.inviter_profile
          const hostAvatar = avatarMap[hostProfile?.avatar || 'avatar-cyber-ghost'] || { gradient: 'from-[#3A3530] to-[#2B2824]', symbol: 'EX' }

          return (
            <Card key={invite.id} className="p-4 flex flex-col justify-between gap-4 relative overflow-hidden border border-amber-500/20 bg-amber-500/[0.01]">
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-4">
                  <h4 className="text-xs font-black text-gray-900 dark:text-white lowercase truncate max-w-[70%]">
                    {roomInfo?.name}
                  </h4>
                  <span className="text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    invited
                  </span>
                </div>
                
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium line-clamp-2 leading-relaxed lowercase min-h-[32px]">
                  {roomInfo?.description || 'no description provided for this cabin.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5 text-xs font-bold gap-3">
                {/* Host info */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`h-6 w-6 rounded-full bg-gradient-to-br ${hostAvatar.gradient} flex items-center justify-center text-[8px] font-bold text-white shrink-0 shadow-sm`}>
                    {hostAvatar.symbol}
                  </div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate lowercase font-semibold">
                    invited by: {hostProfile?.username || 'explorer'}
                  </span>
                </div>

                {/* Join / Decline Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDeclineInvite(invite.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-transparent border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-[10px] font-bold text-gray-500 transition-all active:scale-95 cursor-pointer lowercase h-8 flex items-center justify-center"
                  >
                    decline
                  </button>
                  
                  <button
                    onClick={() => handleAcceptInvite(invite)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10.5px] font-black transition-all duration-300 transform active:scale-95 cursor-pointer lowercase h-8 flex items-center justify-center"
                  >
                    <span>join</span>
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
