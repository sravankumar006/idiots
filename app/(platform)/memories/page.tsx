'use client'

import React, { useState, useEffect } from 'react'
import {
  Brain, Trash2, Eye, EyeOff, Sparkles, Search, Plus, Calendar,
  Image as ImageIcon, MessageCircle, FileText, CheckCircle2,
  Trash, Info, ShieldAlert, Heart
} from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'
import { useMoodAndMemories, MemoryVaultItem, AIMemoryItem } from '@/hooks/useMoodAndMemories'

export default function MemoriesPage() {
  const supabase = createClient()
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState<'vault' | 'ai_engine'>('vault')
  const [searchTerm, setSearchTerm] = useState('')

  // Add custom manual vault memory state
  const [showAddVaultModal, setShowAddVaultModal] = useState(false)
  const [vaultTitle, setVaultTitle] = useState('')
  const [vaultNotes, setVaultNotes] = useState('')
  const [vaultUrl, setVaultUrl] = useState('')
  const [vaultName, setVaultName] = useState('')
  const [isShared, setIsShared] = useState(true)

  // Resolve current user session
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
    aiMemories,
    saveToVault,
    deleteFromVault,
    deleteAIMemory,
    toggleAIMemoryVisibility
  } = useMoodAndMemories(activeProfile?.id)

  // AI Memory Engine controls stored in localStorage
  const [aiMemoryEnabled, setAIMemoryEnabled] = useState(true)

  useEffect(() => {
    if (activeProfile) {
      const enabled = localStorage.getItem(`ai_memory_engine_enabled_${activeProfile.id}`) !== 'false'
      setAIMemoryEnabled(enabled)
    }
  }, [activeProfile])

  const toggleAIMemoryEngine = () => {
    if (!activeProfile) return
    const nextVal = !aiMemoryEnabled
    setAIMemoryEnabled(nextVal)
    localStorage.setItem(`ai_memory_engine_enabled_${activeProfile.id}`, String(nextVal))
  }

  const handleAddVaultItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vaultTitle.trim()) return

    await saveToVault(
      vaultTitle.trim(),
      null, // manual upload has no message_id
      vaultUrl.trim(),
      vaultName.trim() || (vaultUrl ? 'attached_image.png' : ''),
      vaultNotes.trim(),
      isShared
    )

    // Reset inputs
    setVaultTitle('')
    setVaultNotes('')
    setVaultUrl('')
    setVaultName('')
    setIsShared(true)
    setShowAddVaultModal(false)
  }

  // Filter vault items
  const filteredVaultItems = vaultItems.filter((item) => {
    const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.file_name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchSearch
  })

  if (loading || !activeProfile) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
          <p className="text-xs font-semibold text-gray-500 lowercase">accessing secure digital vault...</p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SectionHeader 
          title="digital memory vault" 
          description="Save precious group chat moments, shared photos, and configure long-term AI companion memory engines."
        />
        {activeTab === 'vault' && (
          <button
            onClick={() => setShowAddVaultModal(true)}
            className="glass-button py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 mt-2 sm:mt-0"
          >
            <Plus className="h-4 w-4" />
            <span>Store Moment</span>
          </button>
        )}
      </div>

      {/* Tabs selectors */}
      <div className="flex border-b border-black/5 dark:border-white/5 mt-6 mb-6">
        <button
          onClick={() => setActiveTab('vault')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'vault'
              ? 'border-violet-500 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
          }`}
        >
          Memory Archive Vault 📂
        </button>
        <button
          onClick={() => setActiveTab('ai_engine')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'ai_engine'
              ? 'border-violet-500 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
          }`}
        >
          AI Memory Engine Configuration 🧠
        </button>
      </div>

      {/* TAB 1: MEMORY VAULT */}
      {activeTab === 'vault' && (
        <div className="space-y-4">
          
          {/* Search bar */}
          <div className="relative flex items-center max-w-md">
            <input
              type="text"
              placeholder="Search through saved moments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/3 border border-white/5 rounded-xl py-3 pl-4 pr-12 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/40 transition-all font-semibold"
            />
            <Search className="h-4 w-4 text-gray-500 absolute right-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {filteredVaultItems.length > 0 ? (
              filteredVaultItems.map((item) => {
                const isPhoto = !!item.file_url && (item.file_url.includes('jpg') || item.file_url.includes('png') || item.file_url.includes('jpeg') || item.file_url.includes('active_storage') || item.file_url.includes('unsplash'))
                const isPDF = !!item.file_url && item.file_url.includes('pdf')

                return (
                  <Card key={item.id} className="p-5 flex flex-col justify-between relative overflow-hidden group min-h-[160px] bg-white/2 border-white/5 hover:border-white/10 transition-all">
                    
                    {/* Glow border hover */}
                    <div className="absolute inset-y-0 left-0 w-[3px] bg-violet-400/0 group-hover:bg-violet-400 transition-all" />

                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1.5 uppercase">
                          {isPhoto ? <ImageIcon className="h-3 w-3 text-cyan-400" /> : isPDF ? <FileText className="h-3 w-3 text-emerald-400" /> : <MessageCircle className="h-3 w-3 text-rose-400" />}
                          {isPhoto ? 'photo moment' : isPDF ? 'document' : 'saved chat'}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                            item.is_shared 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {item.is_shared ? 'shared' : 'private'}
                          </span>
                          <button
                            onClick={() => deleteFromVault(item.id)}
                            className="p-1 rounded hover:bg-rose-500/15 text-gray-500 hover:text-rose-400 cursor-pointer"
                            title="Delete memory forever"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-extrabold text-white mt-2.5 lowercase">
                        {item.title}
                      </h4>

                      {item.notes && (
                        <p className="text-[11px] text-gray-400 leading-relaxed font-semibold mt-1.5 bg-white/3 border border-white/5 p-2 rounded-xl italic">
                          "{item.notes}"
                        </p>
                      )}

                      {item.file_url && isPhoto && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-white/5 max-h-32">
                          <img src={item.file_url} alt="stored snapshot" className="w-full h-full object-cover opacity-85 hover:opacity-100 transition-opacity" />
                        </div>
                      )}

                      {item.file_url && !isPhoto && (
                        <a 
                          href={item.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-3 block text-xs font-bold text-violet-400 hover:underline truncate"
                        >
                          🔗 {item.file_name || 'Download attached file'}
                        </a>
                      )}
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-bold">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                  </Card>
                )
              })
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500 font-semibold text-xs border border-dashed border-white/10 rounded-2xl">
                No memories found in the vault. Select "Store Moment" to upload one!
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: AI MEMORY ENGINE CONFIGURATION */}
      {activeTab === 'ai_engine' && (
        <div className="space-y-6 max-w-3xl">
          
          {/* Main Controls Card */}
          <Card className="p-6 bg-white/2 border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-violet-500/5 blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Brain className="h-4 w-4 text-violet-400" />
                  Long-term AI Memory Engine
                </h3>
                <p className="text-[11px] text-gray-400 font-medium max-w-xl">
                  When enabled, the AI companion automatically remembers recurring group patterns, debugging topics, favorite tech stacks, and inside jokes to personalize future assistance.
                </p>
              </div>

              <button
                onClick={toggleAIMemoryEngine}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  aiMemoryEnabled
                    ? 'bg-violet-600 hover:bg-violet-500 text-white'
                    : 'bg-white/5 border border-white/5 text-gray-400 hover:bg-white/8'
                }`}
              >
                {aiMemoryEnabled ? 'Engine: Enabled 🧠' : 'Engine: Disabled 🧘'}
              </button>
            </div>

            <div className="mt-4 p-3 bg-violet-500/5 border border-violet-500/10 rounded-xl flex items-start gap-2 text-[10px] text-violet-300 font-semibold">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>Privacy Guarantee: Memories are private to your user session, transparently visible below, and can be deleted individually at any time. The AI companion will never share them outside the platform lounge.</p>
            </div>
          </Card>

          {/* AI Memories database list */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              established memories ({aiMemories.length})
            </h4>

            {aiMemoryEnabled ? (
              <div className="space-y-2">
                {aiMemories.length > 0 ? (
                  aiMemories.map((mem) => (
                    <div 
                      key={mem.id}
                      className="flex items-center justify-between gap-4 p-3 bg-white/2 border border-white/5 rounded-2xl hover:bg-white/4 transition-all"
                    >
                      <div className="flex items-start gap-3 text-xs font-semibold">
                        <CheckCircle2 className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${mem.is_visible ? 'text-violet-400' : 'text-gray-600'}`} />
                        <div className="space-y-1">
                          <p className={`text-white lowercase ${!mem.is_visible ? 'line-through text-gray-500' : ''}`}>
                            {mem.memory_text}
                          </p>
                          <span className="text-[8px] text-gray-500 font-bold block">
                            recorded {new Date(mem.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => toggleAIMemoryVisibility(mem.id, !mem.is_visible)}
                          className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-white cursor-pointer"
                          title={mem.is_visible ? "Temporarily hide memory from AI context" : "Restore memory to AI context"}
                        >
                          {mem.is_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => deleteAIMemory(mem.id)}
                          className="p-1.5 rounded hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 cursor-pointer"
                          title="Delete memory permanently"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs font-bold text-gray-500 border border-dashed border-white/10 rounded-2xl">
                    No active facts established yet. The AI companion builds memories as you chat lounge.
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center border border-white/5 bg-white/1 rounded-2xl text-xs font-bold text-gray-500">
                ⚠️ AI Memory Engine is currently disabled. Toggle it above to view and collect memories.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Modal: Store vault memory */}
      {showAddVaultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowAddVaultModal(false)} />
          
          <div className="relative w-full max-w-lg bg-[#141520] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleIn text-xs font-bold text-gray-300">
            <h3 className="text-sm font-extrabold text-white lowercase border-b border-white/5 pb-3">
              archive moment in memory vault
            </h3>

            <form onSubmit={handleAddVaultItem} className="space-y-4 mt-4">
              <div>
                <label className="text-gray-400 block mb-1">Moment Title</label>
                <input
                  type="text"
                  required
                  value={vaultTitle}
                  onChange={(e) => setVaultTitle(e.target.value)}
                  placeholder="e.g. Sree and Sravan debugging logs"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Personal Notes / Description</label>
                <textarea
                  value={vaultNotes}
                  onChange={(e) => setVaultNotes(e.target.value)}
                  rows={3}
                  placeholder="Save some comments or logs here..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 block mb-1">Attachment URL (Optional)</label>
                  <input
                    type="url"
                    value={vaultUrl}
                    onChange={(e) => setVaultUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Attachment Filename</label>
                  <input
                    type="text"
                    value={vaultName}
                    onChange={(e) => setVaultName(e.target.value)}
                    placeholder="e.g. screenshot.png"
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
                      name="privacy"
                      checked={isShared}
                      onChange={() => setIsShared(true)}
                      className="accent-violet-500 h-4 w-4 cursor-pointer"
                    />
                    <span className="ml-1.5 text-gray-300 font-semibold">Shared (Visible on Timeline)</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="privacy"
                      checked={!isShared}
                      onChange={() => setIsShared(false)}
                      className="accent-violet-500 h-4 w-4 cursor-pointer"
                    />
                    <span className="ml-1.5 text-gray-300 font-semibold">Private (Vault Only)</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddVaultModal(false)}
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
