'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Archive, Search, Plus, Calendar, Image as ImageIcon,
  MessageCircle, FileText, CheckCircle2, Trash2, Heart,
  Tag, Filter, Sparkles, FolderOpen, AlertCircle, X, HelpCircle
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'
import { useMoodAndMemories, MemoryVaultItem } from '@/hooks/useMoodAndMemories'
import VaultSkeleton from '@/components/vault/VaultSkeleton'

// Polaroid rotation styles
const ROTATIONS = [
  '-rotate-1 hover:rotate-0',
  'rotate-2 hover:rotate-0',
  '-rotate-2 hover:rotate-0',
  'rotate-1 hover:rotate-0',
  '-rotate-3 hover:rotate-0',
  'rotate-3 hover:rotate-0'
]

const CATEGORIES = [
  { id: 'all', label: 'all items 📂' },
  { id: 'photos', label: 'photos 📷' },
  { id: 'chats', label: 'chat clips 💬' },
  { id: 'pdfs', label: 'documents 📄' },
  { id: 'screenshots', label: 'screenshots 💻' },
  { id: 'videos', label: 'videos 🎥' }
]

export default function VaultPage() {
  const supabase = createClient()
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null)
  
  const searchParams = useSearchParams()
  const highlightEntityId = searchParams?.get('entityId')

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [glowingItemId, setGlowingItemId] = useState<string | null>(null)

  // Upload/Store modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [vaultTitle, setVaultTitle] = useState('')
  const [vaultNotes, setVaultNotes] = useState('')
  const [vaultUrl, setVaultUrl] = useState('')
  const [vaultName, setVaultName] = useState('')
  const [vaultCategory, setVaultCategory] = useState('chats')
  const [vaultTags, setVaultTags] = useState('')
  const [isShared, setIsShared] = useState(true)

  // Resolve user profile
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
          if (prof) setActiveProfile(prof as UserProfile)
        }
      } catch (err) {
        console.warn("Could not get active user profile:", err)
      }
    }
    fetchUser()
  }, [supabase])

  const {
    loading,
    vaultItems,
    saveToVault,
    deleteFromVault
  } = useMoodAndMemories(activeProfile?.id)

  const handleAddVaultItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vaultTitle.trim()) return

    const tagsArray = vaultTags.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

    await saveToVault(
      vaultTitle.trim(),
      null, // manual upload has no message_id
      vaultUrl.trim(),
      vaultName.trim() || (vaultUrl ? 'attachment_file' : ''),
      vaultNotes.trim(),
      isShared,
      vaultCategory,
      tagsArray
    )

    // Reset inputs
    setVaultTitle('')
    setVaultNotes('')
    setVaultUrl('')
    setVaultName('')
    setVaultCategory('chats')
    setVaultTags('')
    setIsShared(true)
    setShowAddModal(false)
  }

  // Filter items
  const filteredItems = useMemo(() => {
    return vaultItems.filter((item) => {
      const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.file_name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory
      
      const matchTag = !selectedTag || (item.tags && item.tags.includes(selectedTag))

      return matchSearch && matchCategory && matchTag
    })
  }, [vaultItems, searchTerm, selectedCategory, selectedTag])

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>()
    vaultItems.forEach(item => {
      if (item.tags) {
        item.tags.forEach(t => tagsSet.add(t))
      }
    })
    return Array.from(tagsSet)
  }, [vaultItems])

  // Scroll to highlighted item
  useEffect(() => {
    if (highlightEntityId && vaultItems.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`vault-item-${highlightEntityId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setGlowingItemId(highlightEntityId)
          setTimeout(() => setGlowingItemId(null), 3000)
        }
      }, 300)
    }
  }, [highlightEntityId, vaultItems])

  if (loading || !activeProfile) {
    return (
      <PageContainer>
        <VaultSkeleton />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {/* Import handwritten font styling */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap');
        .handwritten-font {
          font-family: 'Caveat', cursive, sans-serif;
        }
      `}</style>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SectionHeader 
          title="digital memory vault" 
          description="A group scrapbook preserving our funny chats, screenshots, photos, and study records."
        />
        <button
          onClick={() => setShowAddModal(true)}
          className="glass-button py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 mt-2 sm:mt-0"
        >
          <Plus className="h-4 w-4" />
          <span>archive moment</span>
        </button>
      </div>

      {/* Categories Switcher */}
      <div className="flex border-b border-white/5 mt-6 mb-6 overflow-x-auto gap-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id)
              setSelectedTag(null) // reset tag filter
            }}
            className={`py-3 px-5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left 3 columns: Polaroid Scrapbook grid */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Controls: Search */}
          <div className="flex items-center gap-4 bg-white/2 border border-white/5 p-3.5 rounded-2xl">
            <div className="relative flex items-center flex-1">
              <input
                type="text"
                placeholder="Search vault scrapbooks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/3 border border-white/5 rounded-xl py-2 pl-4 pr-10 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/40 font-semibold"
              />
              <Search className="h-4 w-4 text-gray-500 absolute right-3" />
            </div>

            {selectedTag && (
              <div className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-xl text-[10px] font-bold text-violet-300">
                <span>Tag: #{selectedTag}</span>
                <button onClick={() => setSelectedTag(null)} className="hover:text-white cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Polaroid Scrapbook Container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => {
                const rot = ROTATIONS[idx % ROTATIONS.length]
                const isPhoto = item.category === 'photos' || (item.file_url && (item.file_url.includes('jpg') || item.file_url.includes('png') || item.file_url.includes('jpeg') || item.file_url.includes('unsplash')))
                const isPDF = item.category === 'pdfs' || (item.file_url && item.file_url.includes('pdf'))
                const isScreenshot = item.category === 'screenshots'

                return (
                  <div 
                    key={item.id}
                    id={`vault-item-${item.id}`}
                    className={`bg-stone-100 dark:bg-zinc-800 p-4 pb-6 shadow-2xl transition-all duration-300 transform ${rot} hover:-translate-y-2 hover:scale-105 border ${
                      glowingItemId === item.id 
                        ? 'border-violet-500 ring-4 ring-violet-500 shadow-[0_0_25px_rgba(139,92,246,0.8)] dark:shadow-[0_0_25px_rgba(139,92,246,0.6)] z-10' 
                        : 'border-stone-200/50 dark:border-zinc-700/50'
                    }`}
                    style={{ minHeight: '260px' }}
                  >
                    {/* Media frame */}
                    <div className="bg-stone-200 dark:bg-zinc-900 border border-stone-300/40 dark:border-zinc-800/40 h-44 rounded-sm overflow-hidden flex items-center justify-center relative group">
                      
                      {item.file_url && isPhoto ? (
                        <img 
                          src={item.file_url} 
                          alt={item.title} 
                          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" 
                        />
                      ) : isPDF ? (
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-10 w-10 text-rose-500" />
                          <span className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest">PDF Document</span>
                        </div>
                      ) : isScreenshot && item.file_url ? (
                        <img 
                          src={item.file_url} 
                          alt={item.title} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 px-4 text-center">
                          <MessageCircle className="h-10 w-10 text-violet-500" />
                          <span className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest">Chat Quote</span>
                        </div>
                      )}

                      {/* Top Action Overlay */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={() => deleteFromVault(item.id)}
                          className="p-1.5 rounded-lg bg-stone-900/80 hover:bg-red-600 text-white cursor-pointer shadow-md transition-colors"
                          title="Discard photo"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Polaroid Text Area */}
                    <div className="mt-4 space-y-1.5 text-stone-800 dark:text-stone-200">
                      <h4 className="text-lg font-bold leading-tight lowercase handwritten-font tracking-wide">
                        {item.title}
                      </h4>
                      
                      {item.notes && (
                        <p className="text-sm leading-snug font-medium handwritten-font text-stone-600 dark:text-stone-300 italic">
                          "{item.notes}"
                        </p>
                      )}

                      {/* Download Link if PDF */}
                      {item.file_url && !isPhoto && (
                        <a 
                          href={item.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                        >
                          <span>🔗 {item.file_name || 'Download file'}</span>
                        </a>
                      )}

                      {/* Footer tags */}
                      <div className="flex flex-wrap gap-1 pt-2.5">
                        <span className={`text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded ${
                          item.is_shared 
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}>
                          {item.is_shared ? 'crew' : 'private'}
                        </span>
                        
                        {item.tags && item.tags.map((tag) => (
                          <span 
                            key={tag} 
                            onClick={() => setSelectedTag(tag)}
                            className="text-[8px] font-bold text-stone-500 hover:text-violet-600 cursor-pointer"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest pt-2 flex items-center justify-between">
                        <span>scrapbook node</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full text-center py-20 text-xs font-bold text-gray-500 border border-dashed border-white/10 rounded-3xl">
                No polaroids found. Click "Archive Moment" to start pinning your journey!
              </div>
            )}
          </div>

        </div>

        {/* Right column: Tag Cloud & Scrapbook Policy */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4 bg-white/2 border-white/5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Tag className="h-4 w-4 text-violet-400" />
              vault tags cloud
            </h3>
            
            <div className="flex gap-2 flex-wrap pt-1">
              {allTags.length > 0 ? (
                allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`py-1 px-2.5 rounded-lg text-[9px] font-extrabold border transition-all cursor-pointer ${
                      selectedTag === tag
                        ? 'bg-violet-600 border-violet-500 text-white'
                        : 'bg-white/3 border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    #{tag}
                  </button>
                ))
              ) : (
                <span className="text-[10px] text-gray-500 font-bold lowercase">no tags logged yet.</span>
              )}
            </div>
          </Card>

          <Card className="p-5 space-y-3 bg-white/2 border-white/5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              about memory vault
            </h3>
            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
              This vault is a digital scrapbook for Idiots Flame. Unlike standard cloud drives, it focuses on sentimental moments: early code sketches, late night lounge comments, polaroids, and focus streaks.
            </p>
            <p className="text-[10px] text-amber-300 font-bold leading-normal">
              💝 Archive your history. Build your story.
            </p>
          </Card>
        </div>

      </div>

      {/* Modal: Store vault memory */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          
          <div className="relative w-full max-w-lg bg-[#141520] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleIn text-xs font-bold text-gray-300 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-extrabold text-white lowercase border-b border-white/5 pb-3">
              archive moment in scrapbook vault
            </h3>

            <form onSubmit={handleAddVaultItem} className="space-y-4 mt-4">
              <div>
                <label className="text-gray-400 block mb-1">Moment Title</label>
                <input
                  type="text"
                  required
                  value={vaultTitle}
                  onChange={(e) => setVaultTitle(e.target.value)}
                  placeholder="e.g. Bhanu breaking servers screenshot"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 block mb-1">Category</label>
                  <select
                    value={vaultCategory}
                    onChange={(e) => setVaultCategory(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                  >
                    <option value="photos" className="bg-[#141520]">Photo 📷</option>
                    <option value="chats" className="bg-[#141520]">Chat Clip 💬</option>
                    <option value="pdfs" className="bg-[#141520]">PDF Document 📄</option>
                    <option value="screenshots" className="bg-[#141520]">Screenshot 💻</option>
                    <option value="videos" className="bg-[#141520]">Video Clip 🎥</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={vaultTags}
                    onChange={(e) => setVaultTags(e.target.value)}
                    placeholder="e.g. chaos, 3am, deploy"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500/50 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Personal Notes / Scrapbook Caption</label>
                <textarea
                  value={vaultNotes}
                  onChange={(e) => setVaultNotes(e.target.value)}
                  rows={3}
                  placeholder="Tell the funny details or story of this scrapbook node..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 block mb-1">Attachment File URL (Optional)</label>
                  <input
                    type="url"
                    value={vaultUrl}
                    onChange={(e) => setVaultUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Filename Override</label>
                  <input
                    type="text"
                    value={vaultName}
                    onChange={(e) => setVaultName(e.target.value)}
                    placeholder="e.g. database_crash.png"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Privacy Level</label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="vault_privacy"
                      checked={isShared}
                      onChange={() => setIsShared(true)}
                      className="accent-violet-500 h-4 w-4 cursor-pointer"
                    />
                    <span className="ml-1.5 text-gray-300 font-semibold">Shared Scrapbook (Visible to crew)</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="vault_privacy"
                      checked={!isShared}
                      onChange={() => setIsShared(false)}
                      className="accent-violet-500 h-4 w-4 cursor-pointer"
                    />
                    <span className="ml-1.5 text-gray-300 font-semibold">Private Scrapbook (Vault Only)</span>
                  </label>
                </div>
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
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white border-transparent rounded-xl shadow-md cursor-pointer"
                >
                  Archive Moment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </PageContainer>
  )
}
