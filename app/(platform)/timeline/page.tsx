'use client'

import React, { useState, useEffect } from 'react'
import {
  Calendar, Camera, Heart, Plus, Sparkles, Brain, Code, Clock,
  ArrowRight, Image as ImageIcon, MessageCircle, X
} from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'

interface TimelineItem {
  id: string
  title: string
  description: string
  date: string
  type: 'milestone' | 'photo' | 'quote' | 'ai_recall' | 'study_night'
  author?: string
  authorAvatar?: string
  mediaUrl?: string
  reactionsCount?: number
}

const SEED_TIMELINE_ITEMS: TimelineItem[] = [
  {
    id: 't-1',
    title: 'the legendary 3AM debugging marathon 😭',
    description: 'Bhanu, Sravan and Sree stayed awake debugging the Next.js named proxy functions inside proxy.ts. "named proxy exports are the future, guys" was said at 2:45 AM.',
    date: '2026-05-24T02:45:00Z',
    type: 'study_night',
    author: 'Bhanu',
    authorAvatar: 'avatar-neon-pulse',
    reactionsCount: 5
  },
  {
    id: 't-2',
    title: 'completed idiots space initial launch!',
    description: 'First version of the collaborative space deployed successfully on Supabase. Group chat lounge, profiles, and basic real-time state syncd.',
    date: '2026-05-20T18:00:00Z',
    type: 'milestone',
    author: 'Sravan',
    authorAvatar: 'avatar-cyber-ghost',
    reactionsCount: 4
  },
  {
    id: 't-3',
    title: 'quote of the day: "C++ is just C with issues"',
    description: 'Bhanu dropped this legendary line in the chat lounge during a debate about system programming languages.',
    date: '2026-05-18T14:30:00Z',
    type: 'quote',
    author: 'Bhanu',
    authorAvatar: 'avatar-neon-pulse',
    reactionsCount: 6
  },
  {
    id: 't-4',
    title: 'cozy late-night study room session',
    description: 'Total of 480 minutes studied together. The group completed 4 consecutive Pomodoros. Silent focus was absolute.',
    date: '2026-05-15T23:00:00Z',
    type: 'ai_recall',
    author: 'idiot ai',
    authorAvatar: 'avatar-cyber-ghost',
    reactionsCount: 3
  }
]

export default function TimelinePage() {
  const supabase = createClient()
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null)
  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)

  // Add memory modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newType, setNewType] = useState<'photo' | 'quote' | 'milestone'>('quote')
  const [newMediaUrl, setNewMediaUrl] = useState('')

  useEffect(() => {
    const initData = async () => {
      setLoading(true)
      try {
        // Resolve active user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
          if (prof) setActiveProfile(prof as UserProfile)
        }

        // Fetch shared memory vault items
        const { data: vaultRes } = await supabase
          .from('memory_vault')
          .select('*, profiles(*)')
          .eq('is_shared', true)
          .order('created_at', { ascending: false })

        // Fetch projects to list milestones
        const { data: projRes } = await supabase
          .from('projects')
          .select('*, profiles(*)')
          .order('created_at', { ascending: false })

        const dbItems: TimelineItem[] = []

        if (vaultRes) {
          vaultRes.forEach((item: any) => {
            dbItems.push({
              id: item.id,
              title: item.title,
              description: item.notes || 'saved memory.',
              date: item.created_at,
              type: item.file_url ? 'photo' : 'quote',
              author: item.profiles?.username || 'Explorer',
              authorAvatar: item.profiles?.avatar || 'avatar-cyber-ghost',
              mediaUrl: item.file_url || undefined,
              reactionsCount: 2
            })
          })
        }

        if (projRes) {
          projRes.forEach((item: any) => {
            if (item.progress === 100) {
              dbItems.push({
                id: item.id,
                title: `Completed Project: ${item.name}`,
                description: item.description || 'Project reached 100% completion.',
                date: item.created_at,
                type: 'milestone',
                author: item.profiles?.username || 'Explorer',
                authorAvatar: item.profiles?.avatar || 'avatar-cyber-ghost',
                reactionsCount: 3
              })
            }
          })
        }

        // Merge seed items with database items and sort chronologically descending
        const merged = [...dbItems, ...SEED_TIMELINE_ITEMS].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        setItems(merged)

      } catch (err) {
        console.warn("Timeline fetch failed, loading local/seed list:", err)
        
        // Localstorage fallback for custom additions
        const localTimelineAdditions = localStorage.getItem('mock_timeline_additions')
        const additions: TimelineItem[] = localTimelineAdditions ? JSON.parse(localTimelineAdditions) : []

        const merged = [...additions, ...SEED_TIMELINE_ITEMS].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        setItems(merged)
      } finally {
        setLoading(false)
      }
    }

    initData()
  }, [supabase])

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const newItem: TimelineItem = {
      id: `time-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      date: new Date().toISOString(),
      type: newType,
      author: activeProfile?.username || 'You',
      authorAvatar: activeProfile?.avatar || 'avatar-cyber-ghost',
      mediaUrl: newMediaUrl.trim() || undefined,
      reactionsCount: 0
    }

    setItems((prev) => [newItem, ...prev])
    setShowAddModal(false)

    // Save to DB via shared vault memory
    try {
      if (activeProfile) {
        await supabase.from('memory_vault').insert({
          user_id: activeProfile.id,
          title: newTitle.trim(),
          notes: newDesc.trim(),
          file_url: newMediaUrl.trim() || null,
          is_shared: true
        })
      }
    } catch (err) {
      console.warn("Timeline insert failed, saving locally:", err)
      const currentAdditions = JSON.parse(localStorage.getItem('mock_timeline_additions') || '[]')
      localStorage.setItem('mock_timeline_additions', JSON.stringify([newItem, ...currentAdditions]))
    }

    // Reset inputs
    setNewTitle('')
    setNewDesc('')
    setNewMediaUrl('')
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

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
          <p className="text-xs font-semibold text-gray-500 lowercase">retracing timeline memory nodes...</p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SectionHeader 
          title="shared history timeline" 
          description="A warm, chronological archive of funny quotes, project completion milestones, study nights, and shared photos."
        />
        <button
          onClick={() => setShowAddModal(true)}
          className="glass-button py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 mt-2 sm:mt-0"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Vibe Memory</span>
        </button>
      </div>

      {/* Timeline Layout */}
      <div className="relative max-w-4xl mx-auto mt-10 px-4 md:px-0">
        
        {/* Central timeline alignment axis bar */}
        <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-violet-500/30 via-rose-500/30 to-amber-500/5" />

        <div className="space-y-12">
          {items.map((item, index) => {
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
            if (item.type === 'milestone') {
              TimelineIcon = Code
              iconColor = 'bg-emerald-500 text-white'
            } else if (item.type === 'photo') {
              TimelineIcon = Camera
              iconColor = 'bg-cyan-500 text-white'
            } else if (item.type === 'quote') {
              TimelineIcon = MessageCircle
              iconColor = 'bg-rose-500 text-white'
            } else if (item.type === 'study_night') {
              TimelineIcon = Clock
              iconColor = 'bg-amber-500 text-black'
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
                    <TimelineIcon className="h-3 w-3" />
                  </div>
                </div>

                {/* Left spacer for timeline alignment on desktop */}
                <div className="hidden md:block w-1/2" />

                {/* Main Card Content */}
                <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${isLeft ? 'md:pr-10' : 'md:pl-10'}`}>
                  <Card className="p-5 relative bg-white/3 border-white/5 hover:border-white/10 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
                    
                    {/* Glow Accents */}
                    <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-violet-500 to-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Card Header metadata */}
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold mb-2">
                      <span className="flex items-center gap-1.5 uppercase tracking-wider">
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          item.type === 'milestone' ? 'bg-emerald-400' : item.type === 'photo' ? 'bg-cyan-400' : item.type === 'quote' ? 'bg-rose-400' : 'bg-amber-400'
                        }`} />
                        {item.type.replace('_', ' ')}
                      </span>
                      <span>{itemDate} • {itemTime}</span>
                    </div>

                    <h4 className="text-sm font-extrabold text-white lowercase leading-tight group-hover:text-violet-300 transition-colors">
                      {item.title}
                    </h4>

                    <p className="text-xs text-gray-400 font-medium leading-relaxed mt-2">
                      {item.description}
                    </p>

                    {/* Image rendering if attachment exists */}
                    {item.mediaUrl && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-white/5">
                        <img 
                          src={item.mediaUrl} 
                          alt="memory photo attachment"
                          className="w-full h-40 object-cover opacity-80 hover:opacity-100 transition-opacity"
                        />
                      </div>
                    )}

                    {/* Footer - user name + reaction hearts */}
                    <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                        <div className="h-4.5 w-4.5 rounded-full bg-white/10 flex items-center justify-center text-[7px] text-white">
                          {item.author?.slice(0, 2).toUpperCase()}
                        </div>
                        <span>logged by @{item.author}</span>
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
          })}
        </div>

      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          
          <div className="relative w-full max-w-lg bg-[#141520] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleIn text-xs font-bold text-gray-300">
            <h3 className="text-sm font-extrabold text-white lowercase border-b border-white/5 pb-3">
              upload a shared vibe memory
            </h3>

            <form onSubmit={handleAddMemory} className="space-y-4 mt-4">
              <div>
                <label className="text-gray-400 block mb-1">Memory Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                >
                  <option value="quote" className="bg-[#141520]">Funny Chat Quote 💬</option>
                  <option value="photo" className="bg-[#141520]">Group Photo Memory 📷</option>
                  <option value="milestone" className="bg-[#141520]">Project / Study Milestone 🏆</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Title / Caption</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Sravan first fullstack deploy!"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Description / Notes</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  placeholder="Tell the story of this memory..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>

              {newType === 'photo' && (
                <div>
                  <label className="text-gray-400 block mb-1">Image URL</label>
                  <input
                    type="url"
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
              )}

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
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white border-transparent rounded-xl shadow-md cursor-pointer"
                >
                  Post to Timeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </PageContainer>
  )
}
