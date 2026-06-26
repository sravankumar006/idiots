'use client'

import React from 'react'
import Link from 'next/link'
import { Award, Trophy, RefreshCw } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import { Card } from '@/components/ui/Card'
import { useSpaceProfileState } from '../hooks/useSpaceProfileState'
import { WALLPAPERS, THEMES } from '../types/space-profile.types'
import { formatRelativeTime } from '../utils/space-profile.utils'
import SpaceHeader from './SpaceHeader'
import CurrentMissionCard from './CurrentMissionCard'
import ProfessionalPresenceCard from './ProfessionalPresenceCard'
import GithubActivityCard from './GithubActivityCard'
import MoodAndScrapbookCard from './MoodAndScrapbookCard'
import ActiveProjectsCard from './ActiveProjectsCard'
import RecentActivityFeed from './RecentActivityFeed'
import FocusAnalyticsCard from './FocusAnalyticsCard'
import FocusInsightsCard from './FocusInsightsCard'
import ConfigModal from './ConfigModal'
import MoodLogModal from './MoodLogModal'

interface SpaceProfileContainerProps {
  username: string
}

export default function SpaceProfileContainer({ username }: SpaceProfileContainerProps) {
  const state = useSpaceProfileState(username)
  const { spaceData } = state

  if (state.loadingProfile || state.loadingSpace || !spaceData) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
          <p className="text-xs font-semibold text-gray-500 lowercase">visualizing personal room coordinate...</p>
        </div>
      </PageContainer>
    )
  }

  const activeWallpaper = WALLPAPERS.find(w => w.id === spaceData.profile_wallpaper) || WALLPAPERS[0]
  const activeTheme = THEMES[spaceData.theme_colors] || THEMES.violet
  const publicMoodLogs = state.moodLogs.filter(log => log.visibility !== 'private' || !state.isReadOnly)
  const latestMood = publicMoodLogs[0]

  return (
    <div className={`min-h-screen relative overflow-hidden transition-all duration-700 p-6 ${activeWallpaper.css}`}>
      
      {/* Visual effects overlays */}
      {spaceData.profile_accents === 'stars' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-[20%] h-1 w-1 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]" />
          <div className="absolute top-[30%] left-[75%] h-1 w-1 bg-white animate-pulse shadow-[0_0_8px_white]" />
          <div className="absolute top-[60%] left-[10%] h-1.5 w-1.5 rounded-full bg-white animate-pulse shadow-[0_0_12px_white] delay-300" />
          <div className="absolute top-[80%] left-[60%] h-1 w-1 bg-white animate-pulse shadow-[0_0_6px_white] delay-700" />
        </div>
      )}

      {spaceData.profile_accents === 'bubbles' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          <div className="absolute bottom-0 left-[10%] h-8 w-8 rounded-full border border-white/20 animate-bounce duration-8000" />
          <div className="absolute bottom-0 left-[40%] h-12 w-12 rounded-full border border-white/20 animate-bounce duration-12000 delay-500" />
          <div className="absolute bottom-0 left-[80%] h-6 w-6 rounded-full border border-white/20 animate-bounce duration-6000 delay-1000" />
        </div>
      )}

      {spaceData.profile_accents === 'neon' && (
        <div className="absolute inset-0 border-2 border-violet-500/20 pointer-events-none rounded-3xl m-2 blur-xs animate-pulse" />
      )}

      <PageContainer>
        <SpaceHeader
          spaceData={spaceData}
          targetProfile={state.targetProfile}
          latestMood={latestMood}
          isReadOnly={state.isReadOnly}
          openConfigModal={state.openConfigModal}
        />

        {/* Outer widget grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Columns */}
          <div className="lg:col-span-2 space-y-6">
            <CurrentMissionCard integration={state.integration} />
            
            <ProfessionalPresenceCard integration={state.integration} />
            
            <GithubActivityCard
              integration={state.integration}
              loadingGithub={state.loadingGithub}
              githubError={state.githubError}
              githubData={state.githubData}
            />

            <FocusAnalyticsCard
              sessions={state.focusSessions}
              loading={state.loadingFocus}
              themeAccent={spaceData.theme_colors}
            />

            <FocusInsightsCard
              sessions={state.focusSessions}
              loading={state.loadingFocus}
              themeAccent={spaceData.theme_colors}
            />

            <MoodAndScrapbookCard
              latestMood={latestMood}
              isReadOnly={state.isReadOnly}
              setShowMoodLog={state.setShowMoodLog}
              moodTrendSvg={state.moodTrendSvg}
              vaultItems={state.vaultItems}
            />

            <ActiveProjectsCard
              activeProjects={state.activeProjects}
              loadingProjects={state.loadingProjects}
            />

            <RecentActivityFeed
              combinedActivities={state.combinedActivities}
              loadingActivities={state.loadingActivities}
            />
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Presence user detail card */}
            <Card className="p-6 glass-panel border-none text-center flex flex-col items-center">
              <div className="relative mb-3.5">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-violet-500/20 to-rose-500/20 blur-md opacity-70" />
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-tr from-violet-500 to-rose-400 flex items-center justify-center text-xl font-black text-black border border-white/10 relative z-10 shadow-lg`}>
                  {state.targetProfile?.username.slice(0, 2).toUpperCase()}
                </div>
              </div>
              <h3 className="text-sm font-bold text-gray-950 dark:text-white lowercase">@{state.targetProfile?.username}</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest font-black font-sans">
                {state.isReadOnly ? 'linking coordinate' : 'your digital home corner'}
              </p>

              <div className="w-full mt-4 pt-4 border-t border-white/5 text-left text-xs font-semibold space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-550 dark:text-gray-400">Class:</span>
                  <span className="text-violet-450 text-violet-400">{activeTheme.label}</span>
                </div>
                {latestMood && (
                  <div className="flex justify-between">
                    <span className="text-gray-555 dark:text-gray-400">Mood Vibe:</span>
                    <span className="text-rose-455 text-rose-400">{latestMood.mood_label}</span>
                  </div>
                )}
                {state.integration?.github_username && (
                  <div className="flex justify-between">
                    <span className="text-gray-555 dark:text-gray-400">GitHub Node:</span>
                    <span className="text-emerald-455 text-emerald-400">connected</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-555 dark:text-gray-400">Visuals:</span>
                  <span className="text-sky-455 text-sky-400">{spaceData.profile_accents}</span>
                </div>
              </div>
            </Card>

            {/* Pinned moments scrapbook preview */}
            <Card className="p-6 glass-panel border-none space-y-4">
              <h3 className="text-xs font-bold text-gray-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="h-4 w-4 text-violet-400" />
                recent vault entries
              </h3>

              <div className="space-y-3">
                {state.vaultItems && state.vaultItems.length > 0 ? (
                  state.vaultItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="neo-inset-panel border-none p-3 rounded-2xl text-xs space-y-1">
                      <span className="text-[9px] text-neo-secondary font-bold block">
                        {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <p className="font-bold text-gray-950 dark:text-white lowercase">{item.title}</p>
                      {item.notes && <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">"{item.notes}"</p>}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs font-bold text-gray-500 border border-dashed border-white/10 rounded-2xl">
                    no moments pinned.
                  </div>
                )}
              </div>
              
              <Link 
                href="/us/vault" 
                className="block text-center py-2 border border-white/5 rounded-xl text-xs text-violet-400 font-bold hover:bg-white/3 transition-all text-decoration-none"
              >
                Open Scrapbook Vault
              </Link>
            </Card>

            {/* RECENT ACHIEVEMENTS */}
            <Card className="p-6 glass-panel border-none space-y-4">
              <h3 className="text-xs font-bold text-gray-955 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" />
                Recent Achievements
              </h3>

              {state.loadingAchievements ? (
                <div className="flex flex-col items-center justify-center py-6 gap-1 animate-pulse">
                  <RefreshCw className="h-3.5 w-3.5 text-amber-500 animate-spin" />
                  <span className="text-[9px] text-gray-500 font-bold lowercase">fetching achievements...</span>
                </div>
              ) : state.recentAchievements.length === 0 ? (
                <div className="text-center py-4 text-xs font-bold text-gray-500 border border-dashed border-white/10 rounded-2xl">
                  no achievements unlocked.
                </div>
              ) : (
                <div className="space-y-3">
                  {state.recentAchievements.map((ach) => (
                    <div key={ach.id} className="neo-inset-panel border-none p-3 rounded-2xl text-xs space-y-1">
                      <div className="flex justify-between items-baseline gap-1">
                        <span className="text-[9px] text-neo-secondary font-bold uppercase tracking-wider block">
                          {ach.verb}
                        </span>
                        <span className="text-[9.5px] font-bold text-gray-500 dark:text-gray-400">
                          {formatRelativeTime(ach.created_at)}
                        </span>
                      </div>
                      <p className="font-extrabold text-gray-955 dark:text-white lowercase flex items-center gap-1">
                        🏆 {ach.title}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

        </div>

        {/* Modal: Customize Room Settings */}
        <ConfigModal
          showConfig={state.showConfig}
          setShowConfig={state.setShowConfig}
          editingThemeColor={state.editingThemeColor}
          setEditingThemeColor={state.setEditingThemeColor}
          editingWallpaper={state.editingWallpaper}
          setEditingWallpaper={state.setEditingWallpaper}
          editingAccents={state.editingAccents}
          setEditingAccents={state.setEditingAccents}
          editingStatus={state.editingStatus}
          setEditingStatus={state.setEditingStatus}
          editingBanner={state.editingBanner}
          setEditingBanner={state.setEditingBanner}
          editingBio={state.editingBio}
          setEditingBio={state.setEditingBio}
          editingGithub={state.editingGithub}
          setEditingGithub={state.setEditingGithub}
          editingLinkedin={state.editingLinkedin}
          setEditingLinkedin={state.setEditingLinkedin}
          editingPortfolio={state.editingPortfolio}
          setEditingPortfolio={state.setEditingPortfolio}
          editingResume={state.editingResume}
          setEditingResume={state.setEditingResume}
          editingMission={state.editingMission}
          setEditingMission={state.setEditingMission}
          editingProgress={state.editingProgress}
          setEditingProgress={state.setEditingProgress}
          handleSaveConfig={state.handleSaveConfig}
        />

        {/* Modal: Log Mood check-in */}
        <MoodLogModal
          showMoodLog={state.showMoodLog}
          setShowMoodLog={state.setShowMoodLog}
          newMood={state.newMood}
          setNewMood={state.setNewMood}
          newEnergy={state.newEnergy}
          setNewEnergy={state.setNewEnergy}
          newFocus={state.newFocus}
          setNewFocus={state.setNewFocus}
          newStatus={state.newStatus}
          setNewStatus={state.setNewStatus}
          handleSaveMood={state.handleSaveMood}
        />

      </PageContainer>
    </div>
  )
}
