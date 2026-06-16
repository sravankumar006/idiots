'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Sparkles, 
  Search, 
  Copy, 
  Check, 
  MessageSquare, 
  User, 
  Clock, 
  Brain, 
  Filter, 
  Cpu, 
  Terminal,
  Activity,
  CornerDownLeft,
  Settings,
  Database,
  Trash2,
  Maximize,
  Minimize
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChatMessage, UserProfile } from '@/types'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface LogItem {
  id: string
  prompt: string
  response: string | null
  model: string
  created_at: string
  room_id: string | null
  provider: string | null
  response_time_ms: number | null
  success: boolean | null
  error_message: string | null
  profiles: {
    id: string
    username: string
    avatar: string
  } | null
  groups: {
    id: string
    group_name: string
  } | null
}

const AVATAR_MAP: Record<string, { gradient: string; symbol: string }> = {
  'avatar-cyber-ghost': { gradient: 'from-indigo-400 to-purple-500', symbol: 'CM' },
  'avatar-neon-pulse': { gradient: 'from-purple-400 to-pink-500', symbol: 'SL' },
  'avatar-alpha-wing': { gradient: 'from-emerald-400 to-teal-500', symbol: 'MM' },
  'avatar-solar-flare': { gradient: 'from-orange-300 to-rose-400', symbol: 'WP' },
  'avatar-void-runner': { gradient: 'from-rose-400 to-pink-500', symbol: 'CB' },
  'avatar-shadow-blade': { gradient: 'from-slate-400 to-indigo-500', symbol: 'MS' },
}

export default function AiPage() {
  const searchParams = useSearchParams()
  const highlightAiLogId = searchParams?.get('aiLogId')
  const highlightMemoryId = searchParams?.get('memoryId')

  const initialTab = highlightMemoryId ? 'memory' : highlightAiLogId ? 'logs' : 'consultant'
  const [activeTab, setActiveTab] = useState<'consultant' | 'logs' | 'memory'>(initialTab)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  
  // Highlighting effect state
  const [glowingLogId, setGlowingLogId] = useState<string | null>(null)
  const [glowingMemoryId, setGlowingMemoryId] = useState<string | null>(null)
  
  // Tab 1: Personal AI Consultant States
  const [personalPrompt, setPersonalPrompt] = useState('')
  const [personalMessages, setPersonalMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isChatFullscreen, setIsChatFullscreen] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Tab 2: Shared Logs Archive States
  const [logs, setLogs] = useState<LogItem[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({})

  // Tab 3: Memory Center States
  const [memories, setMemories] = useState<any[]>([])
  const [summaries, setSummaries] = useState<any[]>([])
  const [loadingMemory, setLoadingMemory] = useState(false)

  // AI config and live diagnostics status state
  const [selectedProvider, setSelectedProvider] = useState<string>('auto')
  const [modelNameDisplay, setModelNameDisplay] = useState<string>('gemini-2.5-flash')
  const [liveProviders, setLiveProviders] = useState<any[]>([])
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false)

  const supabase = createClient()

  // Fetch currentUser session on mount
  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser({
          id: user.id,
          email: user.email || '',
          username: user.user_metadata?.username || 'Explorer',
          avatar: user.user_metadata?.avatar || 'avatar-cyber-ghost',
          created_at: user.created_at,
        })
      }
    }
    fetchUser()
  }, [])

  // Load local AI provider preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selected_ai_provider') || 'auto'
      setSelectedProvider(saved)
      updateModelNameDisplay(saved)
    }
  }, [])

  const updateModelNameDisplay = (provider: string) => {
    switch (provider) {
      case 'gemini':
        setModelNameDisplay('gemini-2.5-flash')
        break
      case 'openai':
        setModelNameDisplay('gpt-4o-mini')
        break
      case 'openrouter':
        setModelNameDisplay('openrouter-routed')
        break
      default:
        setModelNameDisplay('auto (gemini-2.5-flash with fallbacks)')
    }
  }

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider)
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected_ai_provider', provider)
    }
    updateModelNameDisplay(provider)
  }

  // Fetch live AI systems health status
  const fetchHealthStatus = async () => {
    setLoadingStatus(true)
    try {
      const res = await fetch('/api/ai/providers/status')
      if (res.ok) {
        const data = await res.json()
        if (data.providers) {
          setLiveProviders(data.providers)
        }
      }
    } catch (err) {
      console.warn('Failed to load live health status:', err)
    } finally {
      setLoadingStatus(false)
    }
  }

  useEffect(() => {
    fetchHealthStatus()
    const interval = setInterval(fetchHealthStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll personal consultant chat on message change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [personalMessages])

  // Fetch private consultant messages once user is available
  useEffect(() => {
    if (!currentUser) return
    const userProfile = currentUser

    async function fetchPersonalHistory() {
      try {
        const { data, error } = await supabase
          .from('ai_logs')
          .select('*')
          .is('room_id', null)
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: true })

        if (error) throw error

        if (data) {
          const msgs: ChatMessage[] = []
          data.forEach((log: any) => {
            // User Prompt Message
            msgs.push({
              id: `${log.id}-user`,
              group_id: '',
              sender_id: userProfile.id,
              message: log.prompt,
              type: 'text',
              reply_to: null,
              created_at: log.created_at,
              profiles: userProfile,
              reactions: []
            })
            // AI Response Message
            msgs.push({
              id: `${log.id}-ai`,
              group_id: '',
              sender_id: '00000000-0000-0000-0000-000000000000',
              message: log.response || (log.error_message ? `⚠️ Error: ${log.error_message}` : ''),
              type: 'ai',
              reply_to: null,
              created_at: log.created_at,
              profiles: {
                id: '00000000-0000-0000-0000-000000000000',
                username: 'IS AI',
                email: 'ai@system.local',
                avatar: 'avatar-cyber-ghost',
                created_at: log.created_at
              },
              reactions: []
            })
          })
          setPersonalMessages(msgs)
        }
      } catch (err) {
        console.error('Failed to load private consultant history:', err)
      }
    }

    fetchPersonalHistory()
  }, [currentUser])

  // Fetch shared logs on mount
  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoadingLogs(true)
        const { data, error } = await supabase
          .from('ai_logs')
          .select(`
            id,
            prompt,
            response,
            model,
            created_at,
            room_id,
            provider,
            response_time_ms,
            success,
            error_message,
            profiles (
              id,
              username,
              avatar
            ),
            groups (
              id,
              group_name
            )
          `)
          .order('created_at', { ascending: false })

        if (error) throw error
        setLogs((data as any) || [])
      } catch (err) {
        console.error('Failed to fetch AI logs:', err)
      } finally {
        setLoadingLogs(false)
      }
    }

    fetchLogs()

    // Realtime subscription for live additions to logs
    const subscription = supabase
      .channel('ai_logs_realtime_page')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ai_logs' },
        async (payload) => {
          // Fetch the full record with joins so it matches the state structure
          const { data: newLog, error } = await supabase
            .from('ai_logs')
            .select(`
              id,
              prompt,
              response,
              model,
              created_at,
              room_id,
              provider,
              response_time_ms,
              success,
              error_message,
              profiles (
                id,
                username,
                avatar
              ),
              groups (
                id,
                group_name
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (newLog && !error) {
            setLogs((prev) => [newLog as any, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  // Highlight effect for AI Logs
  useEffect(() => {
    if (activeTab === 'logs' && highlightAiLogId && logs.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`ai-log-${highlightAiLogId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setGlowingLogId(highlightAiLogId)
          // Also automatically expand it
          setExpandedLogs(prev => ({ ...prev, [highlightAiLogId]: true }))
          setTimeout(() => setGlowingLogId(null), 3000)
        }
      }, 300)
    }
  }, [activeTab, highlightAiLogId, logs])

  // Highlight effect for Memories
  useEffect(() => {
    if (activeTab === 'memory' && highlightMemoryId && memories.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`memory-${highlightMemoryId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setGlowingMemoryId(highlightMemoryId)
          setTimeout(() => setGlowingMemoryId(null), 3000)
        }
      }, 300)
    }
  }, [activeTab, highlightMemoryId, memories])

  // Fetch Memories when Memory tab is active
  useEffect(() => {
    if (activeTab !== 'memory' || !currentUser) return

    async function fetchMemories() {
      setLoadingMemory(true)
      try {
        const { data: mems } = await supabase
          .from('ai_memories')
          .select('*')
          .eq('created_by', currentUser!.id)
          .order('updated_at', { ascending: false })

        const { data: sums } = await supabase
          .from('memory_summaries')
          .select('*')
          .order('created_at', { ascending: false })

        setMemories(mems || [])
        setSummaries(sums || [])
      } catch (err) {
        console.error('Failed to load memory center:', err)
      } finally {
        setLoadingMemory(false)
      }
    }

    fetchMemories()
  }, [activeTab, currentUser])

  // Action: Send Private Message in Personal Consultant
  const handleSendPersonal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!personalPrompt.trim() || !currentUser || isTyping) return
    const userProfile = currentUser

    const text = personalPrompt.trim()
    setPersonalPrompt('')
    setIsTyping(true)

    // 1. Optimistic User message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      group_id: '',
      sender_id: userProfile.id,
      message: text,
      type: 'text',
      reply_to: null,
      created_at: new Date().toISOString(),
      profiles: userProfile,
      reactions: []
    }

    // 2. Optimistic empty AI message
    const aiMessageId = `ai-${Date.now()}`
    const aiMsg: ChatMessage = {
      id: aiMessageId,
      group_id: '',
      sender_id: '00000000-0000-0000-0000-000000000000',
      message: '',
      type: 'ai',
      reply_to: null,
      created_at: new Date().toISOString(),
      profiles: {
        id: '00000000-0000-0000-0000-000000000000',
        username: 'IS AI',
        email: 'ai@system.local',
        avatar: 'avatar-cyber-ghost',
        created_at: new Date().toISOString()
      },
      reactions: [],
      sending: true
    }

    setPersonalMessages(prev => [...prev, userMsg, aiMsg])

    try {
      // Map previous messages to prompt context
      const context = personalMessages.slice(-15).map(m => ({
        type: m.type,
        message: m.message
      }))

      const providerPref = typeof window !== 'undefined' ? localStorage.getItem('selected_ai_provider') || 'auto' : 'auto';

      // Call route
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          groupId: null, // Indicates private/personal consultant
          contextMessages: context,
          providerPreference: providerPref
        })
      })

      if (!response.ok) {
        try {
          const errData = await response.json()
          if (errData.message) {
            setPersonalMessages(prev => 
              prev.map(m => m.id === aiMessageId ? { ...m, message: errData.message, sending: false } : m)
            )
            return
          }
        } catch (_) {}
        throw new Error('Private stream response failed')
      }

      if (!response.body) throw new Error('Private stream response failed')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        accumulatedText += chunk

        setPersonalMessages(prev => 
          prev.map(m => m.id === aiMessageId ? { ...m, message: accumulatedText } : m)
        )
      }

      if (!accumulatedText) {
        setPersonalMessages(prev => 
          prev.map(m => m.id === aiMessageId ? { ...m, error: true, sending: false, message: '⚠️ **API Quota/Access Error**\n\nThe AI provider failed to generate any response tokens. This typically means your Gemini API key has exceeded its free tier quota limits, or this model is not enabled for your key.' } : m)
        )
      } else {
        setPersonalMessages(prev => 
          prev.map(m => m.id === aiMessageId ? { ...m, sending: false } : m)
        )
      }

    } catch (err) {
      console.error('Personal Companion request failed:', err)
      setPersonalMessages(prev => 
        prev.map(m => m.id === aiMessageId ? { ...m, error: true, sending: false, message: 'I encountered an error trying to process your request.' } : m)
      )
    } finally {
      setIsTyping(false)
    }
  }

  // Copy response helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }).catch(err => console.error('Copy failed', err))
  }

  // Expand/collapse logs helper
  const toggleExpand = (id: string) => {
    setExpandedLogs(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Extract unique filters from logs
  const uniqueGroups = Array.from(
    new Map(
      logs
        .filter(l => l.groups)
        .map(l => [l.groups!.id, l.groups!.group_name])
    ).entries()
  )

  const uniqueUsers = Array.from(
    new Map(
      logs
        .filter(l => l.profiles)
        .map(l => [l.profiles!.id, l.profiles!.username])
    ).entries()
  )

  // Filter logs list (only show items where room_id is not null)
  const filteredLogs = logs.filter(log => {
    // Only display group logs in the logs tab
    if (!log.room_id) return false

    const matchesSearch = 
      log.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.response ? log.response.toLowerCase().includes(searchQuery.toLowerCase()) : false)
    
    const matchesGroup = selectedGroup === 'all' || log.room_id === selectedGroup
    const matchesUser = selectedUser === 'all' || log.profiles?.id === selectedUser

    return matchesSearch && matchesGroup && matchesUser
  })

  // Group metrics
  const groupLogsOnly = logs.filter(l => l.room_id)
  const totalGroupQueries = groupLogsOnly.length
  const activeRoomsCount = new Set(groupLogsOnly.map(l => l.room_id)).size
  const activeUsersCount = new Set(groupLogsOnly.map(l => l.profiles?.id)).size
  const averageLength = totalGroupQueries > 0 
    ? Math.round(groupLogsOnly.reduce((sum, log) => sum + (log.response ? log.response.length : 0), 0) / totalGroupQueries)
    : 0

  const presets = [
    'Help me map out a database schema for user profiles',
    'Review key design concepts of glassmorphic styling',
    'Synthesize a project proposal structure',
    'Generate a funny joke about programmer bugs'
  ]

  const activeAvatarId = currentUser?.avatar || 'avatar-cyber-ghost'
  const activeAvatar = AVATAR_MAP[activeAvatarId] || AVATAR_MAP['avatar-cyber-ghost']

  return (
    <PageContainer>
      {/* Fullscreen Override Styles */}
      {isChatFullscreen && (
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
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-black/5 dark:border-white/5 select-none ${isChatFullscreen ? 'hidden' : 'flex'}`}>
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
            onClick={() => setActiveTab('consultant')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'consultant'
                ? 'bg-neo-bg shadow-neo text-[#fb864b] border-none'
                : 'text-neo-secondary hover:text-neo-text'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Personal Consultant
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-neo-bg shadow-neo text-[#fb864b] border-none'
                : 'text-neo-secondary hover:text-neo-text'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            #ai logs
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'memory'
                ? 'bg-neo-bg shadow-neo text-[#fb864b] border-none'
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
      {activeTab === 'consultant' && (
        <div className={`grid grid-cols-1 ${isChatFullscreen ? 'lg:grid-cols-1 h-[100dvh] gap-0' : 'lg:grid-cols-3 gap-6'}`}>
          {/* Diagnostic Sidebar */}
          <div className={`space-y-4 select-none ${isChatFullscreen ? 'hidden' : 'block'}`}>
            {/* AI Config & Settings Panel */}
            <Card className="p-6 space-y-4 hover:border-violet-500/10">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
                <Settings className="h-4 w-4 text-[#fb864b]" />
                AI Config & Settings
              </h3>
              
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-semibold">Security Context</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Private 1-on-1
                  </span>
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="ai-provider-select" className="text-gray-500 font-semibold block">Preferred Provider</label>
                  <select
                    id="ai-provider-select"
                    value={selectedProvider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="w-full appearance-none neo-inset-panel border-none rounded-xl py-2.5 px-3 text-xs text-gray-900 dark:text-gray-200 font-bold focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="auto">Auto (Gemini + Fallbacks)</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="openai">OpenAI GPT</option>
                    <option value="openrouter">OpenRouter API</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-semibold">Active AI Model</span>
                  <span className="text-violet-300 font-bold max-w-[150px] truncate text-right" title={modelNameDisplay}>
                    {modelNameDisplay}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-semibold">Logs Location</span>
                  <span className="text-gray-900 dark:text-gray-300 font-semibold lowercase">ai_logs (room: null)</span>
                </div>
              </div>
            </Card>

            {/* AI Systems Monitor Panel */}
            <Card className="p-6 space-y-4 hover:border-emerald-500/10">
              <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  AI Systems Monitor
                </h3>
                {loadingStatus && (
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
                )}
              </div>
              
              <div className="space-y-4 select-none">
                {liveProviders.length === 0 ? (
                  <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                    Loading diagnostics health parameters...
                  </p>
                ) : (
                  liveProviders.map((provider) => {
                    let statusColor = 'text-gray-400 bg-gray-400/10 border-gray-400/20'
                    let statusDot = 'bg-gray-400'
                    if (!provider.configured) {
                      statusColor = 'text-red-400 bg-red-500/10 border-red-500/20'
                      statusDot = 'bg-red-400'
                    } else if (provider.health === 'Healthy') {
                      statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      statusDot = 'bg-emerald-400 animate-pulse'
                    } else if (provider.health === 'Warning') {
                      statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                      statusDot = 'bg-amber-400 animate-pulse'
                    } else if (provider.health === 'Unavailable') {
                      statusColor = 'text-red-400 bg-red-500/10 border-red-500/20'
                      statusDot = 'bg-red-400'
                    }

                    return (
                      <div key={provider.name} className="space-y-1.5 pb-3 border-b border-black/5 dark:border-white/5 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900 dark:text-gray-200">{provider.displayName}</span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusColor}`}>
                            <span className={`h-1 w-1 rounded-full ${statusDot}`} />
                            {provider.configured ? provider.health : 'Not Configured'}
                          </span>
                        </div>
                        
                        {provider.configured && (
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 font-semibold">
                            <div>
                              <span className="text-gray-600 block">Success Rate</span>
                              <span className="text-gray-900 dark:text-gray-300 font-bold">{provider.stats.successRate}%</span>
                            </div>
                            <div>
                              <span className="text-gray-600 block">Avg Latency</span>
                              <span className="text-gray-900 dark:text-gray-300 font-bold">
                                {provider.stats.avgLatencyMs > 0 ? `${(provider.stats.avgLatencyMs / 1000).toFixed(2)}s` : '0.00s'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </Card>

            {/* Prompt Presets */}
            <Card className="p-6 space-y-4 hover:border-rose-500/10">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
                <Brain className="h-4 w-4 text-rose-400" />
                Prompt Presets
              </h3>
              <div className="space-y-2">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPersonalPrompt(preset)}
                    className="w-full text-left p-3 rounded-xl neo-inset-panel border-none text-[11px] font-semibold text-neo-secondary hover:text-neo-text transition-all cursor-pointer leading-normal"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Dialogue Space */}
          <div className={`flex flex-col transition-all duration-300 ${
            isChatFullscreen 
              ? 'col-span-1 h-[100dvh] w-full p-0 md:p-0'
              : 'lg:col-span-2 h-[600px] relative'
          }`}>
            <Card className={`flex-1 flex flex-col overflow-hidden hover:border-white/5 relative ${isChatFullscreen ? 'rounded-none border-none neo-panel shadow-none p-0' : 'p-0'}`}>
              {/* Chat Header for Fullscreen Toggle */}
              <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5 shrink-0 select-none">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Companion Active</span>
                <button
                  onClick={() => setIsChatFullscreen(!isChatFullscreen)}
                  className="p-2 rounded-xl text-neo-secondary hover:text-neo-text hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer border-none"
                  title={isChatFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isChatFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </button>
              </div>

              {/* Messages viewport */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {personalMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 select-none">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-violet-500/10 to-rose-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                      <Sparkles className="h-6 w-6 text-violet-400" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Your Personal Consultant</h3>
                    <p className="text-xs text-gray-500 max-w-sm font-semibold leading-relaxed">
                      Ask technical questions, draft concepts, or synthesize topics. Chat history in this tab is personal and kept secure.
                    </p>
                  </div>
                ) : (
                  personalMessages.map((msg, idx) => {
                    const isSelf = msg.sender_id === currentUser?.id
                    const avatarId = msg.profiles?.avatar || 'avatar-cyber-ghost'
                    const avatar = AVATAR_MAP[avatarId] || AVATAR_MAP['avatar-cyber-ghost']
                    
                    return (
                      <div 
                        key={msg.id || idx} 
                        className={`flex gap-3 w-fit max-w-[75%] animate-fadeIn ${
                          isSelf ? 'ml-auto flex-row-reverse' : ''
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-semibold text-white shadow-md shrink-0 select-none ${
                          isSelf 
                            ? `bg-gradient-to-br ${activeAvatar.gradient}` 
                            : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                        }`}>
                          {isSelf ? activeAvatar.symbol : 'AI'}
                        </div>

                        <div className={`space-y-1 flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                          <span className="text-[10px] font-bold text-gray-500 block">
                            {isSelf ? 'You' : 'Companion'}
                          </span>
                          <div className={`p-4 rounded-2xl text-[13px] leading-relaxed w-fit max-w-full ${
                            isSelf 
                              ? 'bg-neo-bg shadow-neo text-[#fb864b] border-none rounded-tr-none' 
                              : 'neo-inset-panel text-neo-text border-none rounded-tl-none'
                          }`}>
                            {!isSelf ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:neo-inset-panel prose-pre:border-none prose-pre:rounded-xl break-words leading-relaxed text-gray-800 dark:text-gray-300">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {msg.message}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}

                {/* Typing Indicator */}
                {isTyping && personalMessages[personalMessages.length - 1]?.sending && (
                  <div className="flex gap-3 w-fit max-w-[75%] animate-fadeIn">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-semibold text-white shadow-md shrink-0 select-none">
                      AI
                    </div>
                    <div className="space-y-1 flex flex-col items-start">
                      <span className="text-[10px] font-bold text-gray-500 block">Companion</span>
                      <div className="px-4 py-3 neo-inset-panel border-none rounded-2xl rounded-tl-none flex items-center gap-2 w-fit max-w-full">
                        <div className="flex gap-1 items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0ms' }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '150ms' }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs text-neo-secondary font-medium animate-pulse ml-1">
                          {personalMessages[personalMessages.length - 1]?.message ? 'IS AI is generating a response...' : 'IS AI is thinking...'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendPersonal} className="p-4 border-t border-black/5 dark:border-white/5 shrink-0 glass-panel border-none select-none">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Consult your private companion..."
                    value={personalPrompt}
                    onChange={(e) => setPersonalPrompt(e.target.value)}
                    disabled={isTyping}
                    className="w-full neo-inset-panel border-none rounded-2xl py-3.5 pl-4 pr-16 text-xs text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none transition-all font-semibold"
                  />
                  <button
                    type="submit"
                    disabled={isTyping}
                    className="absolute right-2 py-1.5 px-3 rounded-lg bg-neo-bg shadow-neo border-none text-[#fb864b] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-neo-inset transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                  >
                    <span>Query</span>
                    <CornerDownLeft className="h-3 w-3" />
                  </button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: SHARED #AI LOGS                                         */}
      {/* ============================================================== */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Diagnostics Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 select-none">
            <Card className="p-5 flex items-center justify-between hover:border-violet-500/10">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Lounge Queries</span>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-rose-400">
                  {loadingLogs ? '...' : totalGroupQueries}
                </span>
              </div>
              <Activity className="h-6 w-6 text-violet-400/60" />
            </Card>

            <Card className="p-5 flex items-center justify-between hover:border-cyan-500/10">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Active Rooms</span>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  {loadingLogs ? '...' : activeRoomsCount}
                </span>
              </div>
              <MessageSquare className="h-6 w-6 text-cyan-400/60" />
            </Card>

            <Card className="p-5 flex items-center justify-between hover:border-emerald-500/10">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Active Friends</span>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  {loadingLogs ? '...' : activeUsersCount}
                </span>
              </div>
              <User className="h-6 w-6 text-emerald-400/60" />
            </Card>

            <Card className="p-5 flex items-center justify-between hover:border-amber-500/10">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Avg Output Size</span>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">
                  {loadingLogs ? '...' : `${averageLength} chars`}
                </span>
              </div>
              <Terminal className="h-6 w-6 text-amber-400/60" />
            </Card>
          </div>

          {/* Search & Filtering controls */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2 relative flex items-center">
              <Search className="absolute left-4 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search group prompt or response contents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full neo-inset-panel border-none rounded-2xl py-3 pl-11 pr-4 text-xs text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none transition-all font-semibold"
              />
            </div>

            {/* Room Filter */}
            <div className="relative flex items-center">
              <Filter className="absolute left-4 h-4 w-4 text-gray-500" />
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full appearance-none neo-inset-panel border-none rounded-2xl py-3 pl-11 pr-4 text-xs text-gray-900 dark:text-gray-300 font-semibold focus:outline-none transition-all cursor-pointer"
              >
                <option value="all">all rooms</option>
                {uniqueGroups.map(([id, name]) => (
                  <option key={id} value={id}>#{name.toLowerCase()}</option>
                ))}
              </select>
            </div>

            {/* User Filter */}
            <div className="relative flex items-center">
              <User className="absolute left-4 h-4 w-4 text-gray-500" />
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full appearance-none neo-inset-panel border-none rounded-2xl py-3 pl-11 pr-4 text-xs text-gray-900 dark:text-gray-300 font-semibold focus:outline-none transition-all cursor-pointer"
              >
                <option value="all">all users</option>
                {uniqueUsers.map(([id, name]) => (
                  <option key={id} value={id}>{name.toLowerCase()}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Logs List Container */}
          <div className="space-y-4">
            {loadingLogs ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4 select-none">
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center animate-spin">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                </div>
                <span className="text-xs font-semibold text-gray-500 tracking-wider">indexing shared intelligence logs...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <Card className="flex flex-col items-center justify-center text-center py-24 select-none border-none">
                <div className="h-12 w-12 rounded-2xl neo-inset-panel border-none flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-[#fb864b] animate-pulse" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">No companion logs found</h3>
                <p className="text-xs text-gray-500 max-w-sm font-semibold leading-relaxed">
                  {searchQuery || selectedGroup !== 'all' || selectedUser !== 'all'
                    ? "Try adjusting your query or filter parameters to locate the recorded items."
                    : "Ask queries to the AI directly inside any room chat using @rocky to populate the logs archive."
                  }
                </p>
              </Card>
            ) : (
              filteredLogs.map((log) => {
                const isExpanded = expandedLogs[log.id] || false
                const responseText = log.response || ''
                const isLong = responseText.length > 500
                const displayResponse = isExpanded || !isLong 
                  ? responseText 
                  : `${responseText.substring(0, 500)}...`

                const avatarId = log.profiles?.avatar || 'avatar-cyber-ghost'
                const avatar = AVATAR_MAP[avatarId] || AVATAR_MAP['avatar-cyber-ghost']

                const timeFormatted = new Date(log.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })

                const providerDisplayName = log.provider === 'gemini' 
                  ? 'Google Gemini' 
                  : log.provider === 'openai' 
                    ? 'OpenAI GPT' 
                    : log.provider === 'openrouter'
                      ? 'OpenRouter'
                      : 'AI Companion'

                const latencySec = log.response_time_ms 
                  ? `${(log.response_time_ms / 1000).toFixed(1)}s` 
                  : null

                return (
                  <Card 
                    key={log.id} 
                    id={`ai-log-${log.id}`}
                    className={`p-6 md:p-8 space-y-5 hover:border-white/10 shadow-sm relative overflow-hidden transition-all duration-1000 border-none ${
                      glowingLogId === log.id 
                        ? 'ring-2 ring-violet-500 shadow-neo'
                        : ''
                    }`}
                  >
                    {/* Log Meta Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-black/5 dark:border-white/5">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${avatar.gradient} flex items-center justify-center text-[10px] font-semibold text-white select-none`}>
                          {avatar.symbol}
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                              {log.profiles?.username || 'explorer'}
                            </span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full border border-black/5 dark:border-white/5">
                              #{log.groups?.group_name || 'chat room'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold select-none">
                            <Clock className="h-3 w-3" />
                            <span>{timeFormatted}</span>
                          </div>
                        </div>
                      </div>

                      {/* Model badge and actions */}
                      <div className="flex flex-wrap items-center gap-2 select-none">
                        {log.provider && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-xl border border-teal-500/20">
                            {providerDisplayName}
                          </span>
                        )}

                        <span className="flex items-center gap-1 text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-xl border border-violet-500/20">
                          <Cpu className="h-3 w-3" />
                          {log.model}
                        </span>

                        {latencySec && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                            <Clock className="h-3 w-3" />
                            {latencySec}
                          </span>
                        )}

                        <button
                          onClick={() => handleCopy(log.id, log.response || '')}
                          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                            copiedId === log.id 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                              : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                          }`}
                          title="Copy AI Response"
                        >
                          {copiedId === log.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Question/Prompt Section */}
                    <div className="neo-inset-panel border-none rounded-2xl p-4 space-y-1.5">
                      <span className="text-[10px] font-bold text-neo-secondary uppercase tracking-widest block select-none">Query prompt</span>
                      <p className="text-xs font-semibold text-neo-text whitespace-pre-wrap leading-relaxed">
                        {log.prompt}
                      </p>
                    </div>

                    {/* Failure Banner or Response Section */}
                    {log.success === false ? (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2 text-red-400 select-none">
                          <Terminal className="h-4 w-4 shrink-0" />
                          <span className="text-xs font-black uppercase tracking-wider">API Execution Failure Diagnostics</span>
                        </div>
                        
                        <p className="text-xs text-red-300/95 font-semibold leading-relaxed">
                          {log.error_message || 'An unknown server error occurred during inference token generation.'}
                        </p>

                        <div className="bg-black/40 border border-red-500/10 rounded-xl p-3">
                          <code className="text-[10px] font-mono text-red-400/90 block break-all whitespace-pre-wrap">
                            {`Error Code: ERR_API_INFERENCE_FAIL\nTimestamp: ${new Date(log.created_at).toISOString()}\nTarget Provider: ${log.provider || 'unknown'}\nModel Config: ${log.model}`}
                          </code>
                        </div>
                      </div>
                    ) : (
                      /* Response Section */
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block select-none">Companion synthesis</span>
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-code:text-violet-300 break-words leading-relaxed text-gray-800 dark:text-gray-300">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {displayResponse}
                          </ReactMarkdown>
                        </div>

                        {isLong && (
                          <button
                            onClick={() => toggleExpand(log.id)}
                            className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors pt-2 block cursor-pointer select-none"
                          >
                            {isExpanded ? 'Show less' : 'Read full response'}
                          </button>
                        )}
                      </div>
                    )}
                  </Card>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: MEMORY CENTER                                           */}
      {/* ============================================================== */}
      {activeTab === 'memory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="h-4 w-4 text-violet-400" />
                Contextual Memories
              </h3>
              
              {loadingMemory ? (
                <div className="h-40 flex items-center justify-center text-xs text-gray-500 font-semibold">Indexing memories...</div>
              ) : memories.length === 0 ? (
                <Card className="p-10 text-center text-xs text-gray-500 font-semibold border border-white/5">
                  Rocky hasn't learned anything specific about you yet. Talk to Rocky more to generate memories!
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {memories.map((mem) => (
                    <Card 
                      key={mem.id} 
                      id={`memory-${mem.id}`}
                      className={`p-5 space-y-3 transition-all duration-1000 ${
                        glowingMemoryId === mem.id 
                          ? 'ring-2 ring-violet-500 border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.6)] bg-violet-500/10'
                          : 'border border-white/5 hover:border-violet-500/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                          {mem.memory_type}
                        </span>
                        <span className="text-[10px] text-gray-500 font-semibold">
                          {new Date(mem.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-gray-200">{mem.title}</h4>
                        <p className="text-xs text-neo-secondary mt-1 leading-relaxed">{mem.content}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                Conversation Summaries
              </h3>
              
              {loadingMemory ? (
                <div className="h-40 flex items-center justify-center text-xs text-gray-500 font-semibold">Loading summaries...</div>
              ) : summaries.length === 0 ? (
                <Card className="p-10 text-center text-xs text-gray-500 font-semibold border border-white/5">
                  No lengthy conversations have been summarized yet.
                </Card>
              ) : (
                <div className="space-y-4">
                  {summaries.map((sum) => (
                    <Card key={sum.id} className="p-5 space-y-2 border border-white/5">
                      <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Context Sync</span>
                        <span className="text-[10px] text-gray-500">{new Date(sum.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-900 dark:text-gray-300 leading-relaxed font-medium">
                        {sum.summary}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </PageContainer>
  )
}
