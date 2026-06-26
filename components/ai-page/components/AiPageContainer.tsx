'use client'

import React from 'react'
import { Sparkles, User, MessageSquare, Database } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import { useAiPageState } from '../hooks/useAiPageState'
import ProviderStatusPanel from './ProviderStatusPanel'
import RockyChatWindow from './RockyChatWindow'
import AILogsBrowser from './AILogsBrowser'
import MemoryCenterView from './MemoryCenterView'

const AVATAR_MAP: Record<string, { gradient: string; symbol: string }> = {
  'avatar-cyber-ghost': { gradient: 'from-indigo-400 to-purple-500', symbol: 'CM' },
  'avatar-neon-pulse': { gradient: 'from-purple-400 to-pink-500', symbol: 'SL' },
  'avatar-alpha-wing': { gradient: 'from-emerald-400 to-teal-500', symbol: 'MM' },
  'avatar-solar-flare': { gradient: 'from-[#5E4545] to-[#8A6D6D] dark:from-[#ffb4b4] dark:to-[#ff8a8a]', symbol: 'WP' },
  'avatar-void-runner': { gradient: 'from-rose-400 to-pink-500', symbol: 'CB' },
  'avatar-shadow-blade': { gradient: 'from-slate-400 to-indigo-500', symbol: 'MS' },
}

export default function AiPageContainer() {
  const state = useAiPageState()

  return (
    <PageContainer>
      {/* Fullscreen Override Styles */}
      {state.isChatFullscreen && (
        <style>{`
          /* Hide Topbar entirely */
          #topbar-container { display: none !important; }
          
          /* Remove PageContainer constraints to stretch edge-to-edge */
          .max-w-6xl { max-width: 100% !important; padding: 0 !important; }
          
          /* Remove main padding so chat touches the very edges */
          main { padding: 0 !important; }
        `}</style>
      )}

      {/* Immersive Header & Tab Controls */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-black/5 dark:border-white/5 select-none ${state.isChatFullscreen ? 'hidden' : 'flex'}`}>
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-wide uppercase flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            Companion Node
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold tracking-wide">
            Interact with your private AI Consultant or explore shared group query intelligence.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex neo-inset-panel p-1 rounded-2xl border-none shrink-0 self-start sm:self-center">
          <button
            onClick={() => state.setActiveTab('consultant')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              state.activeTab === 'consultant'
                ? 'bg-neo-bg shadow-neo text-[#5E4545] dark:text-[#ffb4b4] border-none'
                : 'text-neo-secondary hover:text-neo-text'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Personal Consultant
          </button>
          <button
            onClick={() => state.setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              state.activeTab === 'logs'
                ? 'bg-neo-bg shadow-neo text-[#5E4545] dark:text-[#ffb4b4] border-none'
                : 'text-neo-secondary hover:text-neo-text'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            #ai logs
          </button>
          <button
            onClick={() => state.setActiveTab('memory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              state.activeTab === 'memory'
                ? 'bg-neo-bg shadow-neo text-[#5E4545] dark:text-[#ffb4b4] border-none'
                : 'text-neo-secondary hover:text-neo-text'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            Memory Center
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: PERSONAL AI CONSULTANT                                  */}
      {/* ============================================================== */}
      {state.activeTab === 'consultant' && (
        <div className={`grid grid-cols-1 ${state.isChatFullscreen ? 'lg:grid-cols-1 h-[100dvh] gap-0' : 'lg:grid-cols-3 gap-6'}`}>
          <ProviderStatusPanel
            selectedProvider={state.selectedProvider}
            handleProviderChange={state.handleProviderChange}
            modelNameDisplay={state.modelNameDisplay}
            liveProviders={state.liveProviders}
            loadingStatus={state.loadingStatus}
            setPersonalPrompt={state.setPersonalPrompt}
            isChatFullscreen={state.isChatFullscreen}
          />
          <RockyChatWindow
            personalMessages={state.personalMessages}
            isTyping={state.isTyping}
            isChatFullscreen={state.isChatFullscreen}
            setIsChatFullscreen={state.setIsChatFullscreen}
            personalPrompt={state.personalPrompt}
            setPersonalPrompt={state.setPersonalPrompt}
            handleSendPersonal={state.handleSendPersonal}
            currentUser={state.currentUser}
            chatEndRef={state.chatEndRef}
            avatarMap={AVATAR_MAP}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: SHARED #AI LOGS                                         */}
      {/* ============================================================== */}
      {state.activeTab === 'logs' && (
        <AILogsBrowser
          logs={state.logs}
          loadingLogs={state.loadingLogs}
          searchQuery={state.searchQuery}
          setSearchQuery={state.setSearchQuery}
          selectedGroup={state.selectedGroup}
          setSelectedGroup={state.setSelectedGroup}
          selectedUser={state.selectedUser}
          setSelectedUser={state.setSelectedUser}
          copiedId={state.copiedId}
          expandedLogs={state.expandedLogs}
          glowingLogId={state.glowingLogId}
          handleCopy={state.handleCopy}
          toggleExpand={state.toggleExpand}
          avatarMap={AVATAR_MAP}
        />
      )}

      {/* ============================================================== */}
      {/* TAB 3: MEMORY CENTER                                           */}
      {/* ============================================================== */}
      {state.activeTab === 'memory' && (
        <MemoryCenterView
          memories={state.memories}
          summaries={state.summaries}
          loadingMemory={state.loadingMemory}
          glowingMemoryId={state.glowingMemoryId}
        />
      )}
    </PageContainer>
  )
}
