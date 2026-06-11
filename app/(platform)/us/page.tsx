'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Sparkles, History, Archive, Award, Camera, Heart, Brain, Clock, Code, Trophy, 
  ChevronRight, ArrowRight, Activity, Calendar, Moon, Flame, AlertCircle
} from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'

export default function UsHubPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [memories, setMemories] = useState<any[]>([])
  const [vaultItems, setVaultItems] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && active) {
          const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
          if (prof && active) setProfile(prof as UserProfile)
        }

        // Fetch public memories
        const { data: memData } = await supabase
          .from('memories')
          .select('*, profiles!created_by(*)')
          .order('created_at', { ascending: false })

        // Fetch shared vault entries
        const { data: vaultData } = await supabase
          .from('vault_entries')
          .select('*')
          .eq('is_shared', true)
          .order('created_at', { ascending: false })

        // Fetch all profiles to calculate crew members list
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')

        if (active) {
          if (memData) setMemories(memData)
          if (vaultData) setVaultItems(vaultData)
          if (profilesData) setProfiles(profilesData)
        }
      } catch (err) {
        console.error("Failed to load Us page data:", err)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => { active = false }
  }, [supabase])

  // Computed Stats for Us
  const stats = useMemo(() => {
    const totalMemories = memories.length
    const totalVault = vaultItems.length
    const totalCrew = profiles.length

    // Calculate latest activity date
    let lastActive = 'Never'
    if (memories.length > 0) {
      const dates = memories.map(m => new Date(m.created_at).getTime())
      const maxDate = new Date(Math.max(...dates))
      lastActive = maxDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    return { totalMemories, totalVault, totalCrew, lastActive }
  }, [memories, vaultItems, profiles])

  // Memories for Polaroid Slider (filter for items that look great as Polaroids)
  const polaroidMemories = useMemo(() => {
    // Select manual, friendship, chaos or items with photos first, limit to 6
    const visual = memories.filter(m => m.media_url || m.memory_type === 'friendship' || m.memory_type === 'chaos')
    if (visual.length > 0) return visual.slice(0, 6)
    return memories.slice(0, 6)
  }, [memories])

  // Timeline preview (last 3 items)
  const timelinePreview = useMemo(() => {
    return memories.slice(0, 3)
  }, [memories])

  // Scrapbook photos grid (photos from vault, limit to 4)
  const scrapbookHighlights = useMemo(() => {
    const images = vaultItems.filter(v => v.file_url && (v.category === 'photos' || v.file_url.match(/\.(jpeg|jpg|gif|png|webp)/i)))
    if (images.length > 0) return images.slice(0, 4)
    return vaultItems.slice(0, 4)
  }, [vaultItems])

  // Calculated Awards based on Memories data
  const calculatedAwards = useMemo(() => {
    const logsCount: Record<string, number> = {}
    const lateNightCount: Record<string, number> = {}
    const chaosCount: Record<string, number> = {}
    const studyCount: Record<string, number> = {}

    memories.forEach(mem => {
      const username = mem.profiles?.username || 'unknown'
      logsCount[username] = (logsCount[username] || 0) + 1

      // 12 AM to 5 AM logic
      const date = new Date(mem.created_at)
      const hour = date.getHours()
      if (hour >= 0 && hour < 5) {
        lateNightCount[username] = (lateNightCount[username] || 0) + 1
      }

      if (mem.memory_type === 'chaos') {
        chaosCount[username] = (chaosCount[username] || 0) + 1
      }
      if (mem.memory_type === 'study') {
        studyCount[username] = (studyCount[username] || 0) + 1
      }
    })

    // Get top users
    const getTopUser = (counts: Record<string, number>, fallback: string) => {
      let topUser = fallback
      let maxVal = 0
      Object.entries(counts).forEach(([user, count]) => {
        if (count > maxVal && user !== 'unknown') {
          maxVal = count
          topUser = user
        }
      })
      return maxVal > 0 ? `@${topUser}` : fallback
    }

    const nightOwl = getTopUser(lateNightCount, '@sravan')
    const chaosMaster = getTopUser(chaosCount, '@bhanu')
    const studyWarrior = getTopUser(studyCount, '@sree')
    const projectCommander = getTopUser(logsCount, '@sravan')

    return [
      { id: 'chaos', name: 'Most Chaotic Member 🌪️', desc: `${chaosMaster} is locking in chaos events. Always breaking prod or starting late discussions.`, val: 'Chaos Badge' },
      { id: 'owl', name: 'Night Owl Award 🦉', desc: `Earned by ${nightOwl} for late-night commits and 3AM debugging sprints.`, val: '3AM Warrior' },
      { id: 'study', name: 'Study Warrior 🕯️', desc: `Dedicated focus sessions lead by ${studyWarrior}. Consistent Pomodoro builder.`, val: 'Leader' },
      { id: 'project', name: 'Project Commander 💻', desc: `Most logged memories and completed project steps by ${projectCommander}.`, val: 'HQ Commander' }
    ]
  }, [memories])

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
          <p className="text-xs font-semibold text-gray-500 lowercase">retracing our crew moments...</p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <SectionHeader 
          title="us hub • crew space" 
          description="A warm, nostalgic archive of our friendships, memories, and collective growth milestones."
        />
        
        {/* Quick Stats Banner */}
        <div className="flex gap-4 p-3 bg-black/5 dark:bg-white/3 border border-black/5 dark:border-white/5 rounded-2xl text-[10px] font-bold text-gray-500 dark:text-gray-400">
          <div className="text-center px-2 border-r border-black/5 dark:border-white/5">
            <span className="block text-violet-500 dark:text-violet-400 text-sm font-extrabold">{stats.totalCrew}</span>
            <span>crew members</span>
          </div>
          <div className="text-center px-2 border-r border-black/5 dark:border-white/5">
            <span className="block text-rose-500 dark:text-rose-400 text-sm font-extrabold">{stats.totalMemories}</span>
            <span>moments logged</span>
          </div>
          <div className="text-center px-2">
            <span className="block text-amber-500 dark:text-amber-400 text-sm font-extrabold">{stats.lastActive}</span>
            <span>last moment</span>
          </div>
        </div>
      </div>

      {/* Main Section Navigation Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Link href="/us/timeline" className="group">
          <Card className="p-6 relative bg-gradient-to-br from-violet-500/5 via-violet-500/0 to-transparent border-white/5 hover:border-violet-500/30 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 shrink-0 group-hover:scale-110 transition-transform">
                <History className="h-5 w-5" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-extrabold text-white lowercase">Shared Timeline</h4>
                  <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-violet-400 transition-colors" />
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                  Browse chronologically through milestones, funny debugging quotes, and screenshots.
                </p>
                <span className="text-[10px] text-violet-400/70 font-bold block pt-1.5 lowercase">
                  View {stats.totalMemories} moments →
                </span>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/us/vault" className="group">
          <Card className="p-6 relative bg-gradient-to-br from-rose-500/5 via-rose-500/0 to-transparent border-white/5 hover:border-rose-500/30 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0 group-hover:scale-110 transition-transform">
                <Archive className="h-5 w-5" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-extrabold text-white lowercase">Scrapbook Vault</h4>
                  <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-rose-400 transition-colors" />
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                  A storage archive of photos, code snippets, study PDFs, and files uploaded by the crew.
                </p>
                <span className="text-[10px] text-rose-400/70 font-bold block pt-1.5 lowercase">
                  View {stats.totalVault} items →
                </span>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Polaroid memory slider */}
      <div className="mt-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-4.5 w-4.5 text-amber-400" />
            <h3 className="text-sm font-extrabold text-white lowercase tracking-wide">
              memory highlights
            </h3>
          </div>
          <span className="text-[10px] text-gray-500 font-bold lowercase">swipe or scroll horizontally ↔</span>
        </div>

        {polaroidMemories.length > 0 ? (
          <div className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x scrollbar-thin scrollbar-thumb-white/10 scroll-smooth">
            {polaroidMemories.map((memory, index) => {
              const rotateClass = index % 3 === 0 ? '-rotate-1 hover:rotate-0' : index % 3 === 1 ? 'rotate-1 hover:rotate-0' : '-rotate-2 hover:rotate-0'
              return (
                <div 
                  key={memory.id} 
                  className={`w-64 shrink-0 snap-start bg-[#fcfbfa] text-gray-900 border border-black/10 p-4 shadow-xl transition-all duration-300 select-none hover:-translate-y-2 hover:shadow-2xl ${rotateClass}`}
                >
                  {/* Image container */}
                  <div className="w-full h-44 bg-gray-200 overflow-hidden border border-black/5 relative group/img">
                    {memory.media_url ? (
                      <img 
                        src={memory.media_url} 
                        alt={memory.title}
                        className="w-full h-full object-cover grayscale-[30%] group-hover/img:grayscale-0 transition-all duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-violet-200 to-rose-200 flex items-center justify-center p-4">
                        <Brain className="h-10 w-10 text-violet-400/50" />
                      </div>
                    )}
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/60 text-[8px] font-black text-white uppercase">
                      {memory.memory_type}
                    </span>
                  </div>

                  {/* Handwriting polaroid bottom caption */}
                  <div className="pt-4 pb-2 space-y-1 font-serif text-center">
                    <h5 className="text-xs font-black text-gray-800 line-clamp-1 italic lowercase">
                      {memory.title}
                    </h5>
                    <p className="text-[10px] text-gray-500 font-semibold line-clamp-2 leading-relaxed">
                      {memory.description || 'moments log.'}
                    </p>
                    <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold pt-2 border-t border-black/5">
                      <span>@{memory.profiles?.username || 'crew'}</span>
                      <span>{new Date(memory.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-gray-500 border border-dashed border-white/10 rounded-3xl">
            No visual memories logged yet. Add one in the Shared Timeline!
          </div>
        )}
      </div>

      {/* Timeline preview & Scrapbook grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        
        {/* Timeline Preview (Left) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4.5 w-4.5 text-violet-400" />
              <h3 className="text-sm font-extrabold text-white lowercase tracking-wide">
                latest milestones
              </h3>
            </div>
            <Link href="/us/timeline" className="text-[10px] text-violet-400 font-bold hover:underline">
              view all ({stats.totalMemories})
            </Link>
          </div>

          <div className="space-y-4">
            {timelinePreview.length > 0 ? (
              timelinePreview.map((item) => {
                let color = 'bg-violet-500'
                if (item.memory_type === 'chaos') color = 'bg-red-500'
                else if (item.memory_type === 'achievement') color = 'bg-amber-500'
                else if (item.memory_type === 'study') color = 'bg-emerald-500'
                else if (item.memory_type === 'project') color = 'bg-sky-500'

                return (
                  <Card key={item.id} className="p-4 bg-white/2 border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${color}`} />
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-xs font-extrabold text-white lowercase truncate">
                            {item.title}
                          </h4>
                          <span className="text-[9px] text-gray-500 font-bold shrink-0">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 line-clamp-1 font-semibold leading-relaxed">
                          {item.description}
                        </p>
                        <span className="text-[9px] text-violet-400/70 font-bold block">
                          by @{item.profiles?.username}
                        </span>
                      </div>
                    </div>
                  </Card>
                )
              })
            ) : (
              <div className="text-center py-10 text-xs text-gray-500 border border-dashed border-white/10 rounded-3xl">
                No memories logged yet.
              </div>
            )}
          </div>
        </div>

        {/* Scrapbook highlights (Right) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Archive className="h-4.5 w-4.5 text-rose-400" />
              <h3 className="text-sm font-extrabold text-white lowercase tracking-wide">
                scrapbook snippets
              </h3>
            </div>
            <Link href="/us/vault" className="text-[10px] text-rose-400 font-bold hover:underline">
              view vault ({stats.totalVault})
            </Link>
          </div>

          {scrapbookHighlights.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {scrapbookHighlights.map((file) => (
                <div 
                  key={file.id} 
                  className="group relative rounded-2xl overflow-hidden border border-white/5 aspect-video bg-white/2"
                >
                  {file.file_url ? (
                    <img 
                      src={file.file_url} 
                      alt={file.title}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-gray-800 to-gray-700 flex items-center justify-center p-3 text-center">
                      <Archive className="h-6 w-6 text-gray-500/50" />
                    </div>
                  )}
                  {/* Overlay text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-end">
                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest block">
                      {file.category || 'file'}
                    </span>
                    <h5 className="text-[10px] font-bold text-white line-clamp-1 lowercase">
                      {file.title}
                    </h5>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-gray-500 border border-dashed border-white/10 rounded-3xl h-[178px] flex items-center justify-center">
              No files saved to scrapbook.
            </div>
          )}
        </div>
      </div>

      {/* Crew Awards Grid */}
      <div className="mt-12 space-y-4">
        <div className="flex items-center gap-2">
          <Award className="h-4.5 w-4.5 text-violet-400" />
          <h3 className="text-sm font-extrabold text-white lowercase tracking-wide">
            crew awards & highlights
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {calculatedAwards.map((stat) => (
            <Card key={stat.id} className="p-5 bg-white/2 border-white/5 hover:border-violet-500/20 transition-all relative overflow-hidden group">
              <div className="absolute inset-y-0 left-0 w-[3px] bg-violet-500/0 group-hover:bg-violet-500 transition-all" />
              <div className="flex justify-between items-start">
                <h4 className="text-[11px] font-black tracking-wider text-violet-400 uppercase">
                  {stat.name}
                </h4>
              </div>
              <p className="text-xs text-gray-400 font-semibold leading-relaxed mt-2 line-clamp-3">
                {stat.desc}
              </p>
              <div className="mt-3 text-[9px] text-gray-500 font-black tracking-widest uppercase">
                {stat.val}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
