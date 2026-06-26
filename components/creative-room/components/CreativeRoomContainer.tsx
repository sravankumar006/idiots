'use client'

import React from 'react'
import { FolderHeart, Save } from 'lucide-react'
import Link from 'next/link'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { useCreativeRoomState } from '../hooks/useCreativeRoomState'

// Subcomponents
import WorkspaceBanner from './WorkspaceBanner'
import TickerHeader from './TickerHeader'
import TabSelector from './TabSelector'
import QuickActions from './QuickActions'
import WorkspaceTasks from './WorkspaceTasks'
import AiAssistantPanel from './AiAssistantPanel'
import TimelineFeed from './TimelineFeed'
import GithubSyncCard from './GithubSyncCard'
import HealthAndStats from './HealthAndStats'
import PresenceList from './PresenceList'
import FileExplorer from './FileExplorer'
import CodeWorkspace from './CodeWorkspace'
import NotesWorkspace from './NotesWorkspace'
import ReferencesWorkspace from './ReferencesWorkspace'
import ActivityWorkspace from './ActivityWorkspace'
import MoodSelectorModal from './MoodSelectorModal'
import CustomizationModal from './CustomizationModal'
import TaskModal from './TaskModal'
import InviteModal from './InviteModal'
import FocusIsland from './FocusIsland'
import FileModal from './FileModal'

interface CreativeRoomContainerProps {
  id: string
}

export default function CreativeRoomContainer({ id }: CreativeRoomContainerProps) {
  const state = useCreativeRoomState(id)

  if (state.projectLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
          <p className="text-xs font-semibold text-gray-500 lowercase">establishing node workspace...</p>
        </div>
      </PageContainer>
    )
  }

  if (!state.project) {
    return (
      <PageContainer>
        <div className="text-center py-12 max-w-md mx-auto animate-fadeIn">
          <FolderHeart className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-2">workspace not found</h3>
          <p className="text-xs text-gray-500 leading-relaxed mb-6 font-semibold">
            The workspace room you are trying to reach does not exist or has been deleted from this node.
          </p>
          <Link href="/growth/creative" className="glass-button text-xs py-2 px-4 rounded-xl font-bold">
            Back to Creative Rooms
          </Link>
        </div>
      </PageContainer>
    )
  }

  // Dynamic Styles matching user customization color
  const accentStyles = {
    '--accent': state.accentColor,
    '--accent-hover': `${state.accentColor}cc`,
    '--accent-light': `${state.accentColor}15`
  } as React.CSSProperties

  return (
    <div style={accentStyles} className="theme-accent-container">
      <PageContainer>
        {/* Banner backdrop banner customization */}
        <WorkspaceBanner
          bannerUrl={state.bannerUrl}
          icon={state.icon}
          mood={state.mood}
          setIsCustomizingAppearance={state.setIsCustomizingAppearance}
          setIsCustomizingMood={state.setIsCustomizingMood}
        />

        {/* Back button and status header banner */}
        <TickerHeader
          activeTab={state.activeTab}
          activeFile={state.activeFile}
          actionAlerts={state.actionAlerts}
          codeSaveStatus={state.codeSaveStatus}
          codeLastSaved={state.codeLastSaved}
        />

        {/* Workspace detailed titles */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-6">
          <SectionHeader 
            title={state.project.name} 
            description={state.project.description || 'Collaborative development space and resource log.'}
          />
          <button
            onClick={state.handleSaveWorkspace}
            disabled={state.isSaving}
            className="glass-button py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 mt-2 lg:mt-0"
          >
            <Save className="h-4 w-4" />
            <span>{state.isSaving ? 'Saving...' : 'Save Workspace'}</span>
          </button>
        </div>

        {/* Tab Selection */}
        <TabSelector
          activeTab={state.activeTab}
          setActiveTab={state.setActiveTab}
          saveCodeImmediately={state.saveCodeImmediately}
        />

        {/* Render Workspace Tab Pages */}
        <div className="animate-pageFadeIn">
          
          {/* ==================== 1. OVERVIEW TAB ==================== */}
          {state.activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                
                {/* A. QUICK ACTIONS PANEL */}
                <QuickActions
                  setActiveTab={state.setActiveTab}
                  setIsNewFileModalOpen={state.setIsNewFileModalOpen}
                  setIsNewTaskModalOpen={state.setIsNewTaskModalOpen}
                  setIsFocusModalOpen={state.setIsFocusModalOpen}
                  setIsInviteModalOpen={state.setIsInviteModalOpen}
                />

                {/* B. TASK BOARD */}
                <WorkspaceTasks
                  tasks={state.tasks}
                  toggleTaskCompletion={state.toggleTaskCompletion}
                  deleteTask={state.deleteTask}
                  setIsNewTaskModalOpen={state.setIsNewTaskModalOpen}
                />

                {/* C. AI WORKSPACE AWARENESS CHAT PANEL */}
                <AiAssistantPanel
                  project={state.project}
                  notes={state.notes}
                  files={state.files}
                  tasks={state.tasks}
                  contributors={state.contributors}
                  onlineUsers={state.onlineUsers}
                  aiPrompt={state.aiPrompt}
                  setAiPrompt={state.setAiPrompt}
                  aiMessages={state.aiMessages}
                  isAiLoading={state.isAiLoading}
                  activeUser={state.activeUser}
                  handleSendAiPrompt={state.handleSendAiPrompt}
                  handleTriggerAiCommand={state.handleTriggerAiCommand}
                  aiChatEndRef={state.aiChatEndRef}
                />

                {/* D. CHRONOLOGICAL PROJECT TIMELINE */}
                <TimelineFeed timelineItems={state.timelineItems} />
              </div>

              <div className="space-y-6 lg:col-span-1">
                {/* GITHUB PROJECT SYNC CARD */}
                <GithubSyncCard
                  githubUrl={state.githubUrl}
                  syncLoading={state.syncLoading}
                  syncError={state.syncError}
                  syncData={state.syncData}
                />

                {/* E. PROJECT HEALTH & STACK CARD */}
                <HealthAndStats health={state.health} stats={state.stats} />

                {/* G. REALTIME PRESENCE & CONTRIBUTOR CARDS */}
                <PresenceList
                  contributors={state.contributors}
                  onlineUsers={state.onlineUsers}
                  insights={state.insights}
                  setIsInviteModalOpen={state.setIsInviteModalOpen}
                />
              </div>
            </div>
          )}

          {/* ==================== 2. CODE TAB (MONACO WORKSPACE) ==================== */}
          {state.activeTab === 'code' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start min-h-[650px] border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden glass-panel bg-white/40 dark:bg-black/25">
              {/* FILE EXPLORER SIDEBAR */}
              <FileExplorer
                filesLoading={state.filesLoading}
                files={state.files}
                activeFileId={state.activeFileId}
                setActiveFileId={state.setActiveFileId}
                broadcastAction={state.broadcastAction}
                renamingFileId={state.renamingFileId}
                renamingFileName={state.renamingFileName}
                setRenamingFileName={state.setRenamingFileName}
                handleSaveRename={state.handleSaveRename}
                renamingFileError={state.renamingFileError}
                handleStartRename={state.handleStartRename}
                handleDeleteFile={state.handleDeleteFile}
                setIsNewFileModalOpen={state.setIsNewFileModalOpen}
                isExplorerOpen={state.isExplorerOpen}
                setIsExplorerOpen={state.setIsExplorerOpen}
              />

              {/* MONACO CODE EDITOR CONTAINER */}
              <CodeWorkspace
                project={state.project}
                activeFile={state.activeFile}
                editorTheme={state.editorTheme}
                setEditorTheme={state.setEditorTheme}
                editorFontSize={state.editorFontSize}
                setEditorFontSize={state.setEditorFontSize}
                isMinimapEnabled={state.isMinimapEnabled}
                setIsMinimapEnabled={state.setIsMinimapEnabled}
                isExplorerOpen={state.isExplorerOpen}
                setIsExplorerOpen={state.setIsExplorerOpen}
                updateFileContent={state.updateFileContent}
                broadcastAction={state.broadcastAction}
                setIsNewFileModalOpen={state.setIsNewFileModalOpen}
              />
            </div>
          )}

          {/* ==================== 3. NOTES TAB ==================== */}
          {state.activeTab === 'notes' && (
            <NotesWorkspace
              notes={state.notes}
              setNotes={state.setNotes}
              broadcastAction={state.broadcastAction}
            />
          )}

          {/* ==================== 4. REFERENCES TAB ==================== */}
          {state.activeTab === 'references' && (
            <ReferencesWorkspace
              references={state.references}
              setReferences={state.setReferences}
              broadcastAction={state.broadcastAction}
            />
          )}

          {/* ==================== 5. ACTIVITY FEED TAB ==================== */}
          {state.activeTab === 'activity' && (
            <ActivityWorkspace activities={state.activities} />
          )}
        </div>

        {/* MODAL: MOOD SELECTOR */}
        <MoodSelectorModal
          isCustomizingMood={state.isCustomizingMood}
          setIsCustomizingMood={state.setIsCustomizingMood}
          handleSelectMood={state.handleSelectMood}
        />

        {/* MODAL: WORKSPACE APPEARANCE CUSTOMIZER */}
        <CustomizationModal
          isCustomizingAppearance={state.isCustomizingAppearance}
          setIsCustomizingAppearance={state.setIsCustomizingAppearance}
          accentColor={state.accentColor}
          handleSelectAccent={state.handleSelectAccent}
          handleSelectBannerPreset={state.handleSelectBannerPreset}
          customBannerUrlInput={state.customBannerUrlInput}
          setCustomBannerUrlInput={state.setCustomBannerUrlInput}
          handleSelectCustomBanner={state.handleSelectCustomBanner}
        />

        {/* MODAL: TASK CREATOR */}
        <TaskModal
          isNewTaskModalOpen={state.isNewTaskModalOpen}
          setIsNewTaskModalOpen={state.setIsNewTaskModalOpen}
          handleCreateTask={state.handleCreateTask}
          taskTitle={state.taskTitle}
          setTaskTitle={state.setTaskTitle}
          taskDesc={state.taskDesc}
          setTaskDesc={state.setTaskDesc}
          taskAssignee={state.taskAssignee}
          setTaskAssignee={state.setTaskAssignee}
          contributors={state.contributors}
        />

        {/* MODAL: ADD CONTRIBUTOR */}
        <InviteModal
          isInviteModalOpen={state.isInviteModalOpen}
          setIsInviteModalOpen={state.setIsInviteModalOpen}
          handleInviteContributor={state.handleInviteContributor}
          inviteName={state.inviteName}
          setInviteName={state.setInviteName}
          inviteError={state.inviteError}
        />

        {/* FLOATING DRAGGABLE FOCUS ISLAND */}
        <FocusIsland
          isFocusModalOpen={state.isFocusModalOpen}
          setIsFocusModalOpen={state.setIsFocusModalOpen}
          islandSize={state.islandSize}
          setIsIslandSize={state.setIsIslandSize}
          islandPosition={state.islandPosition}
          isDragging={state.isDragging}
          handleMouseDown={state.handleMouseDown}
          handleTouchStart={state.handleTouchStart}
          focusTimeRemaining={state.focusTimeRemaining}
          isFocusActive={state.isFocusActive}
          handlePauseFocusSession={state.handlePauseFocusSession}
          handleStartFocusSession={state.handleStartFocusSession}
          focusGoal={state.focusGoal}
          setFocusGoal={state.setFocusGoal}
          focusDuration={state.focusDuration}
          setFocusDuration={state.setFocusDuration}
          handleStopFocusSession={state.handleStopFocusSession}
        />

        {/* FILE CREATION MODAL */}
        <FileModal
          isNewFileModalOpen={state.isNewFileModalOpen}
          setIsNewFileModalOpen={state.setIsNewFileModalOpen}
          handleCreateFile={state.handleCreateFile}
          newFileName={state.newFileName}
          setNewFileName={state.setNewFileName}
          newFileError={state.newFileError}
        />
      </PageContainer>
    </div>
  )
}
