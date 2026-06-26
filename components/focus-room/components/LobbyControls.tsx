import React from 'react'
import { Play, Check } from 'lucide-react'
import { UserProfile, StudyRoomMember } from '@/types'
import { AVATAR_MAP, GOAL_OPTIONS, AMBIENT_THEMES, AmbientTheme } from '../types/focus-room.types'

interface LobbyControlsProps {
  activeProfile: UserProfile | null
  selectedGoal: string
  setSelectedGoal: (val: string) => void
  isNoTimer: boolean
  setIsNoTimer: (val: boolean) => void
  durationMinutes: number
  setDurationMinutes: (val: number) => void
  selectedTheme: string
  setSelectedTheme: (val: string) => void
  currentThemeConfig: AmbientTheme
  isHost: boolean
  isStarting: boolean
  handleStartSession: () => Promise<void>
  canStartSession: boolean
  handleToggleReady: () => Promise<void>
  myMemberRecord: StudyRoomMember | null
  readyCount: number
  totalCount: number
}

export default function LobbyControls({
  activeProfile,
  selectedGoal,
  setSelectedGoal,
  isNoTimer,
  setIsNoTimer,
  durationMinutes,
  setDurationMinutes,
  selectedTheme,
  setSelectedTheme,
  currentThemeConfig,
  isHost,
  isStarting,
  handleStartSession,
  canStartSession,
  handleToggleReady,
  myMemberRecord,
  readyCount,
  totalCount
}: LobbyControlsProps) {
  const activeAvatarMap = AVATAR_MAP[activeProfile?.avatar || 'avatar-cyber-ghost'] || AVATAR_MAP['avatar-cyber-ghost']

  return (
    <div className="lg:col-span-5 flex flex-col gap-4">
      {/* Waiting Room style preview card */}
      <div className="bg-white dark:bg-[#18181f] border border-black/5 dark:border-white/5 rounded-3xl p-5 shadow-neo flex flex-col items-center justify-center gap-4 relative">
        
        {/* Avatar Preview */}
        <div className="relative">
          <div className={`h-24 w-24 rounded-full bg-gradient-to-tr ${activeAvatarMap.gradient} flex items-center justify-center text-2xl font-bold text-white shadow-md border-4 border-white dark:border-[#18181f]`}>
            {activeAvatarMap.symbol}
          </div>
          <span className="absolute bottom-0 right-0 h-4.5 w-4.5 rounded-full border-2 border-white dark:border-[#18181f] bg-emerald-500 shadow-md" />
        </div>

        <div className="text-center">
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white lowercase">
            {!isHost && myMemberRecord?.status === 'ready' ? 'you are ready to focus!' : `ready to focus, ${activeProfile?.username}?`}
          </h3>
          <p className="text-[10px] text-gray-400 font-semibold leading-relaxed mt-1">
            goal: <span className="text-amber-500 font-black">{selectedGoal}</span> • theme: <span className="text-amber-500 font-black">{currentThemeConfig.name}</span>
          </p>
        </div>

        {!isHost && myMemberRecord?.status === 'ready' ? (
          <div className="flex flex-col items-center justify-center p-6 bg-amber-500/5 dark:bg-amber-500/[0.02] border border-amber-500/25 rounded-2xl w-full gap-3 my-2 shadow-sm animate-pulse">
            <div className="relative flex items-center justify-center">
              <svg className="animate-spin h-10 w-10 text-amber-500 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 3 22 21 2 21" />
              </svg>
            </div>
            <p className="text-xs font-black text-amber-600 dark:text-amber-400 tracking-wider lowercase">
              room is starting...
            </p>
          </div>
        ) : (
          <>
            {/* Goal, Duration & Theme Quick Settings */}
            <div className="w-full grid grid-cols-2 gap-2 mt-2">
              
              {/* Goal Select */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-0.5">focus goal</span>
                <select
                  value={selectedGoal}
                  onChange={(e) => setSelectedGoal(e.target.value)}
                  className="w-full bg-[#faf8f5] dark:bg-[#15171d] border border-black/5 dark:border-white/5 rounded-xl px-3 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-amber-500/50 font-semibold h-10 lowercase"
                >
                  {GOAL_OPTIONS.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* Duration Select */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-0.5">duration</span>
                <select
                  value={isNoTimer ? 'stopwatch' : durationMinutes}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'stopwatch') {
                      setIsNoTimer(true);
                      setDurationMinutes(0);
                    } else {
                      setIsNoTimer(false);
                      setDurationMinutes(parseInt(val));
                    }
                  }}
                  className="w-full bg-[#faf8f5] dark:bg-[#15171d] border border-black/5 dark:border-white/5 rounded-xl px-3 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-amber-500/50 font-semibold h-10 lowercase"
                >
                  <option value={25}>25m (pomodoro)</option>
                  <option value={50}>50m</option>
                  <option value={5}>5m (short break)</option>
                  <option value={15}>15m</option>
                  <option value="stopwatch">stopwatch</option>
                </select>
              </div>

            </div>

            <div className="w-full flex flex-col gap-1">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-0.5">theme atmosphere</span>
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="w-full bg-[#faf8f5] dark:bg-[#15171d] border border-black/5 dark:border-white/5 rounded-xl px-3 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-amber-500/50 font-semibold h-10 lowercase"
              >
                {AMBIENT_THEMES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Action Button */}
        <div className="w-full mt-2">
          {isHost ? (
            <div className="space-y-2">
              <button
                disabled={isStarting}
                onClick={handleStartSession}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-md cursor-pointer transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 h-11 border-none lowercase font-semibold"
              >
                <Play className="h-4.5 w-4.5 fill-white shrink-0" />
                <span>{isStarting ? 'starting...' : 'start focus cabin'}</span>
              </button>
              {!canStartSession && (
                <p className="text-[9px] text-center font-bold text-amber-600 dark:text-amber-550/70 lowercase leading-none">
                  waiting for everyone to be ready...
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={handleToggleReady}
              className={`w-full py-3.5 rounded-xl text-white text-xs font-black shadow-md cursor-pointer transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-1.5 h-11 border-none lowercase font-semibold ${
                myMemberRecord?.status === 'ready'
                  ? 'bg-emerald-555 bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-700'
                  : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              <Check className="h-4.5 w-4.5 shrink-0" />
              <span>{myMemberRecord?.status === 'ready' ? 'cancel ready status' : 'i\'m ready'}</span>
            </button>
          )}
        </div>

      </div>

      {/* Crew status strip */}
      <div className="flex justify-between items-center px-2 py-1 lg:hidden">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          readiness status
        </span>
        <span className="text-[10px] font-black text-amber-500 lowercase bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
          {readyCount}/{totalCount} members ready
        </span>
      </div>

    </div>
  )
}
