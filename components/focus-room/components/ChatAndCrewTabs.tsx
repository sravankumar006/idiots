import React from 'react'
import { BookText, Send } from 'lucide-react'
import { UserProfile, StudyRoomComment } from '@/types'
import { AVATAR_MAP } from '../types/focus-room.types'

interface CrewMember {
  id: string
  user_id: string
  username: string
  avatar: string
  is_host: boolean
  is_pending: boolean
  computedStatus: 'offline' | 'joined' | 'ready'
}

interface ChatAndCrewTabsProps {
  isFullscreen: boolean
  activeTab: 'chat' | 'crew'
  setActiveTab: (val: 'chat' | 'crew') => void
  comments: StudyRoomComment[]
  activeProfile: UserProfile | null
  commentText: string
  setCommentText: (val: string) => void
  isSendingComment: boolean
  handlePostComment: (e: React.FormEvent) => Promise<void>
  mappedCrew: CrewMember[]
  chatEndRef: React.RefObject<HTMLDivElement | null>
}

export default function ChatAndCrewTabs({
  isFullscreen,
  activeTab,
  setActiveTab,
  comments,
  activeProfile,
  commentText,
  setCommentText,
  isSendingComment,
  handlePostComment,
  mappedCrew,
  chatEndRef
}: ChatAndCrewTabsProps) {
  return (
    <div className={`flex flex-col border rounded-3xl overflow-hidden shadow-lg ${
      isFullscreen 
        ? 'lg:col-span-7 lg:flex lg:flex-col bg-black/25 dark:bg-white/[0.01] border-white/5 lg:h-[calc(100vh-10rem)] backdrop-blur-xl flex-1'
        : 'lg:col-span-7 flex flex-col min-h-[450px] lg:h-[calc(100vh-6.5rem)] bg-white/40 dark:bg-black/10 border-black/5 dark:border-white/5 mb-6'
    }`}>
      
      {/* Tab Selector */}
      <div className={`flex border-b h-11 select-none ${
        isFullscreen 
          ? 'border-white/5 bg-black/20' 
          : 'border-black/5 dark:border-white/5 bg-[#faf8f5]/60 dark:bg-[#15171d]/60'
      }`}>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center text-xs font-black lowercase transition-all cursor-pointer border-none bg-transparent ${
            activeTab === 'chat'
              ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-500 font-bold'
              : isFullscreen 
                ? 'text-gray-405 text-gray-400 hover:text-gray-300' 
                : 'text-gray-450 dark:text-gray-500 hover:text-gray-700'
          }`}
        >
          lounge chat
        </button>
        <button
          onClick={() => setActiveTab('crew')}
          className={`flex-1 flex items-center justify-center text-xs font-black lowercase transition-all cursor-pointer border-none bg-transparent ${
            activeTab === 'crew'
              ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-500 font-bold'
              : isFullscreen 
                ? 'text-gray-455 text-gray-400 hover:text-gray-300' 
                : 'text-gray-450 dark:text-gray-500 hover:text-gray-700'
          }`}
        >
          cabin crew ({mappedCrew.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        
        {/* Chat Feed Content */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin">
              {comments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
                  <BookText className={`h-8 w-8 ${isFullscreen ? 'text-gray-500/40' : 'text-gray-300 dark:text-gray-700'}`} />
                  <p className="text-xs text-gray-400 lowercase font-semibold">chat feed is empty.</p>
                  <p className="text-[10px] text-gray-500 lowercase leading-relaxed font-semibold">write a check-in message to start talking.</p>
                </div>
              ) : (
                comments.map((comment) => {
                  const isMe = comment.user_id === activeProfile?.id
                  const av = AVATAR_MAP[comment.profiles?.avatar || 'avatar-cyber-ghost'] || AVATAR_MAP['avatar-cyber-ghost']

                  return (
                    <div key={comment.id} className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                      <div className="relative shrink-0 mt-0.5">
                        <div className={`h-8 w-8 rounded-full bg-gradient-to-tr ${av.gradient} flex items-center justify-center text-[9px] font-bold text-white shadow-sm`}>
                          {av.symbol}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <div className={`flex items-center gap-1.5 text-[9px] text-gray-400 font-bold ${isMe ? 'justify-end' : ''}`}>
                          <span>{comment.profiles?.username || 'explorer'}</span>
                          <span>•</span>
                          <span>{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed border ${
                          isMe 
                            ? 'bg-amber-500/10 border-amber-500/20 text-gray-200 rounded-tr-none' 
                            : isFullscreen
                              ? 'bg-black/25 border-white/5 text-gray-200 rounded-tl-none'
                              : 'bg-white dark:bg-[#18181f] border-black/5 dark:border-white/5 text-gray-750 dark:text-gray-250 rounded-tl-none'
                        }`}>
                          {comment.message}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handlePostComment} className={`p-3 border-t shrink-0 ${
              isFullscreen 
                ? 'bg-black/20 border-white/5' 
                : 'bg-white/40 dark:bg-black/20 border-black/5 dark:border-white/[0.05]'
            }`}>
              <div className="flex gap-2 relative">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value.slice(0, 300))}
                  placeholder="send a message to crew..."
                  disabled={isSendingComment}
                  className={`flex-1 border rounded-xl px-4 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500/50 transition-all font-semibold h-10 ${
                    isFullscreen
                      ? 'bg-black/40 border-white/5'
                      : 'bg-white dark:bg-[#15171d] border-black/8 dark:border-white/8 text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || isSendingComment}
                  className="w-10 h-10 flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 shrink-0 border-none"
                  style={{ minHeight: '40px', minWidth: '40px' }}
                >
                  <Send className="h-4 w-4 fill-white" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Crew Content */}
        {activeTab === 'crew' && (
          <div className="flex-1 p-6 space-y-3 overflow-y-auto scrollbar-thin">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 lg:hidden">active cabin crew</h4>
            <div className="space-y-2.5">
              {mappedCrew.map((m) => {
                const av = AVATAR_MAP[m.avatar || 'avatar-cyber-ghost'] || AVATAR_MAP['avatar-cyber-ghost']
                let trafficLightColor = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                if (m.computedStatus === 'ready') {
                  trafficLightColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                } else if (m.computedStatus === 'joined') {
                  trafficLightColor = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                }

                return (
                  <div key={m.id} className={`flex items-center justify-between p-3 rounded-2xl border ${
                    isFullscreen
                      ? 'bg-black/25 border-white/5'
                      : 'bg-white dark:bg-[#18181f]/80 border-black/5 dark:border-white/5'
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${av.gradient} flex items-center justify-center text-[9px] font-bold text-white shrink-0 shadow-sm`}>
                        {av.symbol}
                      </div>
                      <span className="text-xs font-semibold text-gray-250 dark:text-gray-300 truncate lowercase">
                        {m.username}
                        {m.is_host && <span className="ml-1.5 text-[7px] font-extrabold uppercase text-amber-400 tracking-wide bg-amber-500/10 px-1 rounded">host</span>}
                        {m.is_pending && <span className="ml-1.5 text-[7px] font-extrabold uppercase text-gray-400 tracking-wide bg-white/5 px-1 rounded">invited</span>}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[9px] font-bold text-gray-400 lowercase">
                        {m.is_pending ? 'invited' : m.computedStatus}
                      </span>
                      <div className={`h-2.5 w-2.5 rounded-full ${trafficLightColor}`} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
