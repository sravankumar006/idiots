'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Calendar, Camera, Heart, Plus, Sparkles, Brain, Code, Clock,
  ArrowRight, Image as ImageIcon, MessageCircle, X, Search,
  Award, History, RefreshCw, Trophy, Flame, HelpCircle
} from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { uploadFile } from '@/lib/storage/uploadFile'
import { getPublicUrl } from '@/lib/storage/getFileUrl'
import { UserProfile } from '@/types'
import TimelineSkeleton from '@/components/timeline/TimelineSkeleton'

interface TimelineItem {
  id: string
  title: string
  description: string
  date: string
  memory_type: 'manual' | 'ai_recall' | 'achievement' | 'study' | 'project' | 'friendship' | 'chaos'
  author?: string
  authorAvatar?: string
  mediaUrl?: string
  reactionsCount?: number
  relatedUsers?: string[]
}

const MEMORY_TYPES = [
  { id: 'all', label: 'all vibes 🌈', color: 'bg-white/10 text-white' },
  { id: 'manual', label: 'logged memories ✍️', color: 'bg-violet-500/25 text-violet-300 border border-violet-500/30' },
  { id: 'ai_recall', label: 'ai recalls 🧠', color: 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/30' },
  { id: 'achievement', label: 'achievements 🏆', color: 'bg-amber-500/25 text-amber-300 border border-amber-500/30' },
  { id: 'study', label: 'study nights 🕯️', color: 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/30' },
  { id: 'project', label: 'crew projects 💻', color: 'bg-sky-500/25 text-sky-300 border border-sky-500/30' },
  { id: 'friendship', label: 'friendship 💖', color: 'bg-rose-500/25 text-rose-300 border border-rose-500/30' },
  { id: 'chaos', label: 'pure chaos 😭', color: 'bg-red-500/25 text-red-300 border border-red-500/30' }
]

export default function TimelinePage() {
  const supabase = createClient()
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null)
  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)

  // Navigation tabs: timeline vs crew awards
  const [activeViewTab, setActiveViewTab] = useState<'timeline' | 'awards'>('timeline')

  // Search & Filtering states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')

  // Pagination for infinite scroll simulation
  const [visibleCount, setVisibleCount] = useState(6)

  // Add memory modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newType, setNewType] = useState<'manual' | 'friendship' | 'chaos'>('manual')
  const [newMediaUrl, setNewMediaUrl] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [relatedMembers, setRelatedMembers] = useState<string>('')

  useEffect(() => {
    let active = true

    const initData = async () => {
      setLoading(true)
      try {
        // 1. Resolve active user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (user && active) {
          const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
          if (prof && active) setActiveProfile(prof as UserProfile)
        }

        // 2. Fetch memories from DB
        const { data: memoriesRes, error } = await supabase
          .from('memories')
          .select('*, profiles(*)')
          .order('created_at', { ascending: false })

        if (error) throw error
        if (!active) return

        const dbItems: TimelineItem[] = []

        if (memoriesRes) {
          memoriesRes.forEach((item: any) => {
            dbItems.push({
              id: item.id,
              title: item.title,
              description: item.description || 'no details added.',
              date: item.created_at,
              memory_type: (item.memory_type || item.type || 'manual') as any,
              author: item.profiles?.username || 'Crew Member',
              authorAvatar: item.profiles?.avatar || 'avatar-cyber-ghost',
              mediaUrl: item.media_url || undefined,
              reactionsCount: 0,
              relatedUsers: item.related_users || []
            })
          })
        }

        setItems(dbItems)

      } catch (err: any) {
        console.error("Timeline fetch failed:", err?.message || err)
      } finally {
        if (active) setLoading(false)
      }
    }

    initData()

    // Realtime subscription for live additions/updates/deletions on memories
    const channel = supabase
      .channel('timeline_realtime_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memories' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: newMem, error } = await supabase
              .from('memories')
              .select('*, profiles(*)')
              .eq('id', payload.new.id)
              .single()

            if (newMem && !error && active) {
              const formatted: TimelineItem = {
                id: newMem.id,
                title: newMem.title,
                description: newMem.description || 'no details added.',
                date: newMem.created_at,
                memory_type: (newMem.memory_type || newMem.type || 'manual') as any,
                author: newMem.profiles?.username || 'Crew Member',
                authorAvatar: newMem.profiles?.avatar || 'avatar-cyber-ghost',
                mediaUrl: newMem.media_url || undefined,
                reactionsCount: 0,
                relatedUsers: newMem.related_users || []
              }
              setItems((prev) => {
                if (prev.some(item => item.id === formatted.id)) return prev
                return [formatted, ...prev]
              })
            }
          } else if (payload.eventType === 'DELETE' && active) {
            setItems((prev) => prev.filter(item => item.id !== payload.old.id))
          } else if (payload.eventType === 'UPDATE' && active) {
            const { data: updatedMem, error } = await supabase
              .from('memories')
              .select('*, profiles(*)')
              .eq('id', payload.new.id)
              .single()

            if (updatedMem && !error && active) {
              const formatted: TimelineItem = {
                id: updatedMem.id,
                title: updatedMem.title,
                description: updatedMem.description || 'no details added.',
                date: updatedMem.created_at,
                memory_type: (updatedMem.memory_type || updatedMem.type || 'manual') as any,
                author: updatedMem.profiles?.username || 'Crew Member',
                authorAvatar: updatedMem.profiles?.avatar || 'avatar-cyber-ghost',
                mediaUrl: updatedMem.media_url || undefined,
                reactionsCount: payload.new.reactionsCount || 0,
                relatedUsers: updatedMem.related_users || []
              }
              setItems((prev) => prev.map(item => item.id === formatted.id ? formatted : item))
            }
          }
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Process memory lists (Filter + Search)
  const processedItems = useMemo(() => {
    return items.filter((item) => {
      const matchType = selectedType === 'all' || item.memory_type === selectedType
      const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.author && item.author.toLowerCase().includes(searchTerm.toLowerCase()))
      return matchType && matchSearch
    })
  }, [items, selectedType, searchTerm])

  // Get dynamic recall items for Nostalgia Corner (e.g. older than 7 days, select a random one)
  const nostalgiaRecall = useMemo(() => {
    const historical = items.filter(item => {
      const daysAgo = (Date.now() - new Date(item.date).getTime()) / (1000 * 3600 * 24)
      return daysAgo > 30 // Month ago or older
    })
    if (historical.length === 0) return items[items.length - 1] // Fallback to oldest memory
    // Return a random historical memory
    return historical[Math.floor(Math.random() * historical.length)]
  }, [items])

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    setIsUploading(true)
    let finalMediaUrl = newMediaUrl.trim()
    const tempId = `temp-${Date.now()}`

    try {
      if (!activeProfile) throw new Error("No active profile")

      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${activeProfile.id}/${fileName}`
        
        const path = await uploadFile({
          bucket: 'chat-media',
          path: filePath,
          file: mediaFile,
        })
        
        finalMediaUrl = getPublicUrl('chat-media', path)
      }

      const tempItem: TimelineItem = {
        id: tempId,
        title: newTitle.trim(),
        description: newDesc.trim(),
        date: new Date().toISOString(),
        memory_type: newType,
        author: activeProfile?.username || 'You',
        authorAvatar: activeProfile?.avatar || 'avatar-cyber-ghost',
        mediaUrl: finalMediaUrl || undefined,
        reactionsCount: 0,
        relatedUsers: relatedMembers ? relatedMembers.split(',').map(s => s.trim()) : []
      }

      setItems((prev) => [tempItem, ...prev])
      setShowAddModal(false)

      let insertPayload: any = {
        created_by: activeProfile.id,
        user_id: activeProfile.id,
        title: newTitle.trim(),
        description: newDesc.trim(),
        memory_type: newType,
        type: newType,
        media_url: finalMediaUrl || '',
        visibility: 'public',
        related_users: tempItem.relatedUsers
      }

      let { data, error } = await supabase
        .from('memories')
        .insert(insertPayload)
        .select('*, profiles(*)')
        .single()

      // Fallback for older schemas (migration_part10) that lack created_by, memory_type, related_users
      if (error && error.message?.includes('schema cache')) {
        insertPayload = {
          user_id: activeProfile.id,
          title: newTitle.trim(),
          description: newDesc.trim() + (relatedMembers ? `\n(With: ${relatedMembers})` : ''),
          type: newType,
          media_url: finalMediaUrl || '',
          visibility: 'public'
        }
        const fallbackRes = await supabase
          .from('memories')
          .insert(insertPayload)
          .select('*, profiles(*)')
          .single()
        data = fallbackRes.data
        error = fallbackRes.error
      }

      if (error) throw error

      if (data) {
        const dbFormatted: TimelineItem = {
          id: data.id,
          title: data.title,
          description: data.description || 'no details added.',
          date: data.created_at,
          memory_type: (data.memory_type || data.type || 'manual') as any,
          author: data.profiles?.username || 'Crew Member',
          authorAvatar: data.profiles?.avatar || 'avatar-cyber-ghost',
          mediaUrl: data.media_url || undefined,
          reactionsCount: 0,
          relatedUsers: data.related_users || []
        }
        setItems((prev) => prev.map(i => i.id === tempId ? dbFormatted : i))
      }
    } catch (error: any) {
      console.error('Failed to add memory:', error?.message || error)
      setItems((prev) => prev.filter(i => i.id !== tempId)) // Revert optimistic UI on fail
    } finally {
      setIsUploading(false)
      setNewTitle('')
      setNewDesc('')
      setNewMediaUrl('')
      setMediaFile(null)
      setRelatedMembers('')
    }
  }

  const handleLike = (id: string) => {
    setItems((prev) => 
      prev.map(item => 
        item.id === id 
          ? { ...item, reactionsCount: (item.reactionsCount || 0) + 1 } 
          : item
      )
    )
  }

  // Playful awards calculation
  const friendshipStats = useMemo(() => {
    const counts = {
      chaos: 0,
      study: 0,
      project: 0,
      summons: 0,
      owls: 0
    }

    items.forEach(item => {
      if (item.memory_type === 'chaos') counts.chaos++
      if (item.memory_type === 'study') counts.study++
      if (item.memory_type === 'project') counts.project++
      if (item.memory_type === 'ai_recall') counts.summons++
      
      const hour = new Date(item.date).getHours()
      if (hour >= 0 && hour < 5) counts.owls++
    })

    return [
      { id: 'chaos', name: 'Most Chaotic Member 🌪️', desc: 'Bhanu holds the title after breaking production at 3AM 😭. Keeps things interesting.', val: `${counts.chaos} logs` },
      { id: 'owl', name: 'Night Owl Award 🦉', desc: 'Awarded for persistent 3AM coding & debugging sessions. Sravan is locked in.', val: `${counts.owls} events` },
      { id: 'summons', name: 'AI Summoner 🧠', desc: 'Summoned Rocky the AI companion for help most frequently. Bhuvan is learning fast.', val: `${counts.summons} calls` },
      { id: 'study', name: 'Study Warrior 🕯️', desc: 'Dedicated focus session student. Sree leads with high Pomodoro streaks.', val: `${counts.study} sessions` },
      { id: 'project', name: 'Project Commander 💻', desc: 'Pushed the most commits and milestone checks. Sravan keeps the timeline moving.', val: `${counts.project} targets` },
      { id: 'arg', name: 'Argument Champion 💬', desc: 'Most chat message debate reactions in lounge. Lekhya is undefeated.', val: '12 debates' }
    ]
  }, [items])

  if (loading) {
    return (
      <PageContainer>
        <TimelineSkeleton />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SectionHeader 
          title="shared history timeline" 
          description="A chronological archive of our friendships, memories, projects, study milestones, and chaos."
        />
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="glass-button py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer mt-2 sm:mt-0"
          >
            <Plus className="h-4 w-4" />
            <span>log new memory</span>
          </button>
        </div>
      </div>

      {/* Tabs selectors: Timeline vs Crew Awards */}
      <div className="flex border-b border-white/5 mt-6 mb-6">
        <button
          onClick={() => setActiveViewTab('timeline')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeViewTab === 'timeline'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Timeline Story</span>
        </button>
        <button
          onClick={() => setActiveViewTab('awards')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeViewTab === 'awards'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Friendship Analytics & Awards</span>
        </button>
      </div>

      {activeViewTab === 'timeline' ? (
        <div className="space-y-8">
          {/* Nostalgia Recall Corner */}
          {nostalgiaRecall && (
            <Card className="p-5 border-amber-500/20 bg-amber-500/5 relative overflow-hidden backdrop-blur-xl animate-fadeIn">
              <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-amber-500/5 blur-xl pointer-events-none" />
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block">nostalgia memory recall</span>
                  <h4 className="text-sm font-extrabold text-white lowercase">
                    "{nostalgiaRecall.title}"
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                    {nostalgiaRecall.description}
                  </p>
                  <span className="text-[10px] text-gray-500 font-bold block pt-1">
                    logged by @{nostalgiaRecall.author} on {new Date(nostalgiaRecall.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Filtering & Search Controls */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white/2 border border-white/5 p-4 rounded-2xl">
            {/* Search Input */}
            <div className="relative flex items-center flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search group memories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/3 border border-white/5 rounded-xl py-2.5 pl-4 pr-10 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/40 font-semibold"
              />
              <Search className="h-4 w-4 text-gray-500 absolute right-3" />
            </div>

            {/* Filters Row */}
            <div className="flex gap-2 flex-wrap items-center">
              {MEMORY_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type.id)
                    setVisibleCount(6) // Reset infinite scroll counter on filter change
                  }}
                  className={`py-1.5 px-3.5 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                    selectedType === type.id
                      ? 'bg-violet-600 border border-violet-500 text-white'
                      : 'bg-white/3 border border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Layout */}
          <div className="relative max-w-4xl mx-auto mt-6 px-4 md:px-0">
            {/* Central timeline alignment axis bar */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-violet-500/30 via-rose-500/30 to-amber-500/5" />

            <div className="space-y-12">
              {processedItems.length > 0 ? (
                processedItems.slice(0, visibleCount).map((item, index) => {
                  const isLeft = index % 2 === 0
                  const itemDate = new Date(item.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                  const itemTime = new Date(item.date).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })

                  // Define icons based on type
                  let TimelineIcon = Brain
                  let iconColor = 'bg-violet-500 text-white'
                  if (item.memory_type === 'project') {
                    TimelineIcon = Code
                    iconColor = 'bg-sky-500 text-white'
                  } else if (item.memory_type === 'achievement') {
                    TimelineIcon = Trophy
                    iconColor = 'bg-amber-500 text-black'
                  } else if (item.memory_type === 'study') {
                    TimelineIcon = Clock
                    iconColor = 'bg-emerald-500 text-white'
                  } else if (item.memory_type === 'chaos') {
                    TimelineIcon = X
                    iconColor = 'bg-red-500 text-white'
                  } else if (item.memory_type === 'friendship') {
                    TimelineIcon = Heart
                    iconColor = 'bg-rose-500 text-white'
                  } else if (item.memory_type === 'ai_recall') {
                    TimelineIcon = Brain
                    iconColor = 'bg-indigo-500 text-white'
                  }

                  return (
                    <div 
                      key={item.id} 
                      className={`relative flex flex-col md:flex-row items-stretch ${
                        isLeft ? 'md:flex-row-reverse' : ''
                      }`}
                    >
                      {/* Timeline Node Point (Glow Circle) */}
                      <div className="absolute left-6 md:left-1/2 -translate-x-[11px] md:-translate-x-1/2 top-4 z-10">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center shadow-lg ${iconColor} border border-white/20 scale-100 hover:scale-120 transition-transform duration-300`}>
                          <TimelineIcon className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      {/* Spacer for desktop alignment */}
                      <div className="hidden md:block w-1/2" />

                      {/* Card Content */}
                      <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${isLeft ? 'md:pr-10' : 'md:pl-10'}`}>
                        <Card className="p-5 relative bg-white/3 border-white/5 hover:border-white/10 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
                          {/* Glow Accents */}
                          <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-violet-500 to-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          {/* Card Header metadata */}
                          <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold mb-2">
                            <span className="flex items-center gap-1.5 uppercase tracking-wider">
                              <span className={`h-1.5 w-1.5 rounded-full ${iconColor.split(' ')[0]}`} />
                              {item.memory_type.replace('_', ' ')}
                            </span>
                            <span>{itemDate} • {itemTime}</span>
                          </div>

                          <h4 className="text-sm font-extrabold text-white lowercase leading-tight group-hover:text-violet-300 transition-colors">
                            {item.title}
                          </h4>

                          <p className="text-xs text-gray-400 font-medium leading-relaxed mt-2 whitespace-pre-wrap">
                            {item.description}
                          </p>

                          {/* Image rendering */}
                          {item.mediaUrl && (
                            <div className="mt-3 rounded-xl overflow-hidden border border-white/5">
                              <img 
                                src={item.mediaUrl} 
                                alt="memory attachment"
                                className="w-full h-40 object-cover opacity-80 hover:opacity-100 transition-opacity"
                              />
                            </div>
                          )}

                          {/* Related users tags */}
                          {item.relatedUsers && item.relatedUsers.length > 0 && (
                            <div className="flex gap-1.5 mt-3 flex-wrap">
                              {item.relatedUsers.map((user) => (
                                <span key={user} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] text-gray-400 font-bold">
                                  @{user}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Footer - logged user + hearts */}
                          <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                              <div className="h-4.5 w-4.5 rounded-full bg-white/10 flex items-center justify-center text-[7px] text-white">
                                {item.author?.slice(0, 2).toUpperCase()}
                              </div>
                              <span>@{item.author}</span>
                            </div>

                            <button 
                              onClick={() => handleLike(item.id)}
                              className="py-1 px-2.5 rounded-lg bg-white/5 hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 border border-white/5 transition-all text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Heart className="h-3 w-3 fill-rose-500/0 hover:fill-rose-500" />
                              <span>{item.reactionsCount || 0}</span>
                            </button>
                          </div>
                        </Card>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-16 text-xs text-gray-500 font-bold border border-dashed border-white/10 rounded-3xl">
                  no memories found matching the query.
                </div>
              )}
            </div>

            {/* Load More Button for Infinite Scroll Preparation */}
            {processedItems.length > visibleCount && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="py-2.5 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-white hover:text-violet-300 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
                  <span>Load More Memories</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Awards Grid Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
          {friendshipStats.map((stat) => (
            <Card key={stat.id} className="p-6 bg-white/2 border-white/5 hover:border-violet-500/20 transition-all relative overflow-hidden group">
              <div className="absolute inset-y-0 left-0 w-[3px] bg-violet-400/0 group-hover:bg-violet-400 transition-all" />
              <div className="flex justify-between items-start">
                <h4 className="text-xs font-extrabold text-white lowercase group-hover:text-violet-300 transition-colors">
                  {stat.name}
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-black tracking-wider uppercase">
                  {stat.val}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-semibold leading-relaxed mt-2.5">
                {stat.desc}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          
          <div className="relative w-full max-w-lg bg-[#141520] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleIn text-xs font-bold text-gray-300">
            <h3 className="text-sm font-extrabold text-white lowercase border-b border-white/5 pb-3">
              log a crew vibe memory
            </h3>

            <form onSubmit={handleAddMemory} className="space-y-4 mt-4">
              <div>
                <label className="text-gray-400 block mb-1">Vibe Category</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                >
                  <option value="manual" className="bg-[#141520]">General Memory 📝</option>
                  <option value="friendship" className="bg-[#141520]">Friendship Moment 💕</option>
                  <option value="chaos" className="bg-[#141520]">Pure Chaos (Error/Breakage) 😭</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Memory Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Sravan broke production again!"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Description / Inside Story</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  placeholder="What is the story of this memory? Write it down..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Attachment (Image/Video) or URL (Optional)</label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setMediaFile(e.target.files[0])
                          setNewMediaUrl('')
                        }
                      }}
                      className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-violet-500/10 file:text-violet-400 hover:file:bg-violet-500/20 bg-white/5 border border-white/10 rounded-xl focus:outline-none"
                    />
                    <span className="text-xs text-gray-500 font-bold">OR</span>
                    <input
                      type="url"
                      value={newMediaUrl}
                      onChange={(e) => {
                        setNewMediaUrl(e.target.value)
                        setMediaFile(null)
                      }}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                  {mediaFile && (
                    <p className="text-[10px] text-emerald-400 font-medium">Selected file: {mediaFile.name}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Related Crew Members (comma-separated usernames)</label>
                <input
                  type="text"
                  value={relatedMembers}
                  onChange={(e) => setRelatedMembers(e.target.value)}
                  placeholder="e.g. sravan, bhanu, bhuvan"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500/50 font-semibold"
                />
              </div>

              <div className="pt-3 border-t border-white/5 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white border-transparent rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Log Memory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
