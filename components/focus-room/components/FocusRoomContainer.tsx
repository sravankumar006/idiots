'use client'

import React from 'react'
import { ArrowLeft, X, Clock, Users, Send } from 'lucide-react'
import { useFocusRoomState } from '../hooks/useFocusRoomState'
import { AMBIENT_THEMES } from '../types/focus-room.types'
import TimerPanel from './TimerPanel'
import LobbyControls from './LobbyControls'
import ChatAndCrewTabs from './ChatAndCrewTabs'
import ReflectionModal from './ReflectionModal'

interface FocusRoomContainerProps {
  roomId: string
}

export default function FocusRoomContainer({ roomId }: FocusRoomContainerProps) {
  const state = useFocusRoomState(roomId)
  const chatEndRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [state.comments])

  if (state.roomLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-neo-bg">
        <div className="h-8 w-8 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
        <p className="text-xs font-semibold text-gray-500 lowercase">syncing focus cabin data...</p>
      </div>
    )
  }

  if (!state.room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-neo-bg">
        <p className="text-sm font-bold text-gray-500">Cabin not found.</p>
        <button onClick={() => state.router.push('/focus')} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold h-11 border-none cursor-pointer">
          Back to Lounge
        </button>
      </div>
    )
  }

  const hostProfile = (state.room as any).profiles
  const progressPercent = state.displayIsNoTimer ? 100 : Math.min(100, (state.elapsedSeconds / (state.displayDurationMinutes * 60)) * 100)
  const currentThemeConfig = AMBIENT_THEMES.find(t => t.id === state.selectedTheme) || AMBIENT_THEMES[0]

  if (state.isFullscreen) {
    const activeSidebarTab = state.sessionTab === 'timer' ? 'chat' : state.sessionTab

    return (
      <div className={`flex flex-col w-full h-[100dvh] select-none relative overflow-hidden ${currentThemeConfig.bg}`}>
        
        {/* Background patterns/animations */}
        {state.selectedTheme === 'minimal_zen' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-[60vw] w-[60vw] rounded-full bg-amber-500/5 dark:bg-amber-500/[0.03] blur-3xl animate-breathing" />
          </div>
        )}

        {state.selectedTheme === 'rain' && (
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="rainPatternSub" width="40" height="40" patternUnits="userSpaceOnUse">
                  <line x1="10" y1="0" x2="10" y2="20" stroke="rgba(14, 165, 233, 0.4)" strokeWidth="1" />
                  <line x1="30" y1="20" x2="30" y2="40" stroke="rgba(14, 165, 233, 0.3)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#rainPatternSub)" className="animate-rain-fall" />
            </svg>
          </div>
        )}

        {state.selectedTheme === 'aurora' && (
          <div className="absolute inset-0 pointer-events-none opacity-50 bg-[radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.15),transparent_60%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent_60%)] animate-aurora" />
        )}

        {state.selectedTheme === 'deep_space' && (
          <div className="absolute inset-0 pointer-events-none opacity-80">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i} 
                className="absolute bg-white rounded-full animate-twinkle" 
                style={{
                  top: `${(i * 7 + 13) % 95}%`,
                  left: `${(i * 13 + 7) % 95}%`,
                  width: `${(i % 3) + 1.5}px`,
                  height: `${(i % 3) + 1.5}px`,
                  animationDelay: `${i * 0.4}s`
                }}
              />
            ))}
          </div>
        )}

        {state.selectedTheme === 'coding_cave' && (
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:30px_30px]" />
        )}

        {state.selectedTheme === 'ocean_depth' && (
          <div className="absolute inset-0 pointer-events-none opacity-30 bg-radial from-[#1e40af]/20 to-transparent blur-3xl animate-ocean" />
        )}

        {/* Active Session Header */}
        <header className="relative z-10 flex items-center justify-between px-4 lg:px-6 h-14 shrink-0 border-b border-white/5 bg-transparent max-w-6xl mx-auto w-full">
          <div>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none block">cabin focus active</span>
            <h3 className="text-xs font-black text-white lowercase mt-0.5">{state.selectedGoal}</h3>
          </div>

          <button
            onClick={state.handleAbandonSession}
            className="py-2 px-3.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-[10px] font-black tracking-wide lowercase cursor-pointer flex items-center gap-1.5 h-9"
          >
            <X className="h-4 w-4 shrink-0" />
            <span>{state.isHost ? 'abandon' : 'leave'}</span>
          </button>
        </header>

        {/* Main content body */}
        <div className="flex-1 overflow-y-auto lg:overflow-visible min-h-0 relative z-10 max-w-6xl mx-auto w-full px-4 lg:px-6 py-4 flex flex-col lg:grid lg:grid-cols-12 gap-6">
          <TimerPanel
            displayIsNoTimer={state.displayIsNoTimer}
            elapsedSeconds={state.elapsedSeconds}
            displayDurationMinutes={state.displayDurationMinutes}
            isHost={state.isHost}
            isActive={state.isActive}
            handleToggleTimer={state.handleToggleTimer}
            handleManualEndSession={state.handleManualEndSession}
            progressPercent={progressPercent}
            sessionTab={state.sessionTab}
          />
          <ChatAndCrewTabs
            isFullscreen={true}
            activeTab={activeSidebarTab}
            setActiveTab={state.setSessionTab as any}
            comments={state.comments}
            activeProfile={state.activeProfile}
            commentText={state.commentText}
            setCommentText={state.setCommentText}
            isSendingComment={state.isSendingComment}
            handlePostComment={state.handlePostComment}
            mappedCrew={state.mappedCrew}
            chatEndRef={chatEndRef}
          />
        </div>

        {/* Tab Navigation Bar (Bottom) */}
        <footer className="relative z-10 shrink-0 h-16 border-t border-white/5 bg-black/10 dark:bg-black/25 flex items-center justify-around select-none max-w-xl mx-auto w-full lg:hidden">
          <button
            onClick={() => state.setSessionTab('timer')}
            className={`flex flex-col items-center justify-center gap-1.5 w-16 h-12 rounded-xl transition-all cursor-pointer border-none bg-transparent ${
              state.sessionTab === 'timer' ? 'text-amber-500 scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-300'
            }`}
          >
            <Clock className="h-5 w-5 shrink-0" />
            <span className="text-[9px] font-black tracking-wide lowercase">timer</span>
          </button>
          
          <button
            onClick={() => state.setSessionTab('crew')}
            className={`flex flex-col items-center justify-center gap-1.5 w-16 h-12 rounded-xl transition-all cursor-pointer border-none bg-transparent ${
              state.sessionTab === 'crew' ? 'text-amber-500 scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-300'
            }`}
          >
            <Users className="h-5 w-5 shrink-0" />
            <span className="text-[9px] font-black tracking-wide lowercase">crew</span>
          </button>
          
          <button
            onClick={() => state.setSessionTab('chat')}
            className={`flex flex-col items-center justify-center gap-1.5 w-16 h-12 rounded-xl transition-all cursor-pointer border-none bg-transparent ${
              state.sessionTab === 'chat' ? 'text-amber-500 scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-300'
            }`}
          >
            <Send className="h-5 w-5 shrink-0" />
            <span className="text-[9px] font-black tracking-wide lowercase">chat</span>
          </button>
        </footer>

        {/* REFLECTION CATALOGING MODAL */}
        <ReflectionModal
          showCompletionModal={state.showCompletionModal}
          accomplishments={state.accomplishments}
          setAccomplishments={state.setAccomplishments}
          reflectionRating={state.reflectionRating}
          setReflectionRating={state.setReflectionRating}
          reflections={state.reflections}
          setReflections={state.setReflections}
          isSubmitting={state.isSubmitting}
          handleAbandonSession={state.handleAbandonSession}
          handleSaveCompletion={state.handleSaveCompletion}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-hidden w-full h-[100dvh] bg-neo-bg select-none">
      {/* Dynamic Header */}
      <header className="relative z-10 flex items-center justify-between px-4 h-14 shrink-0 shadow-neo bg-neo-bg border-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => state.router.push('/focus')}
            className="flex items-center justify-center h-9 w-9 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-all cursor-pointer border-none bg-transparent"
            title="Return to Study Lounge"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="min-w-0">
            <h2 className="text-sm font-black text-gray-900 dark:text-white lowercase truncate leading-none mt-0.5">
              {state.room.name}
            </h2>
            <span className="text-[10px] text-gray-400 font-semibold lowercase">
              host: {hostProfile?.username || 'explorer'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {state.isHost ? (
            <button
              onClick={state.handleCompleteRoom}
              className="px-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-xs font-black transition-all cursor-pointer h-9 lowercase"
            >
              complete session
            </button>
          ) : (
            <button
              onClick={state.handleLeaveRoom}
              className="px-3.5 rounded-xl bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-xs font-black transition-all cursor-pointer h-9 lowercase"
            >
              leave
            </button>
          )}
        </div>
      </header>

      {/* Responsive Grid Layout Body */}
      <div className="flex-1 overflow-y-auto min-h-0 w-full px-4 py-4 scrollbar-thin">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          <LobbyControls
            activeProfile={state.activeProfile}
            selectedGoal={state.selectedGoal}
            setSelectedGoal={state.setSelectedGoal}
            isNoTimer={state.isNoTimer}
            setIsNoTimer={state.setIsNoTimer}
            durationMinutes={state.durationMinutes}
            setDurationMinutes={state.setDurationMinutes}
            selectedTheme={state.selectedTheme}
            setSelectedTheme={state.setSelectedTheme}
            currentThemeConfig={currentThemeConfig}
            isHost={state.isHost}
            isStarting={state.isStarting}
            handleStartSession={state.handleStartSession}
            canStartSession={state.canStartSession}
            handleToggleReady={state.handleToggleReady}
            myMemberRecord={state.myMemberRecord}
            readyCount={state.readyCount}
            totalCount={state.totalCount}
          />
          <ChatAndCrewTabs
            isFullscreen={false}
            activeTab={state.lobbyTab}
            setActiveTab={state.setLobbyTab}
            comments={state.comments}
            activeProfile={state.activeProfile}
            commentText={state.commentText}
            setCommentText={state.setCommentText}
            isSendingComment={state.isSendingComment}
            handlePostComment={state.handlePostComment}
            mappedCrew={state.mappedCrew}
            chatEndRef={chatEndRef}
          />
        </div>
      </div>
    </div>
  )
}
