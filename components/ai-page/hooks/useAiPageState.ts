import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChatMessage, UserProfile } from '@/types'
import { LogItem } from '../types/ai-page.types'
import { handleCopy as copyToClipboard } from '@/lib/utils/clipboard'
import {
  getHealthStatus,
  getPersonalLogs,
  getAiMemories,
  getMemorySummaries,
  getCurrentUser,
  getSharedLogs,
  getSingleLogWithRelations,
  subscribeToLogs,
  unsubscribeChannel,
  sendChatMessage
} from '../services/ai-page.service'

export function useAiPageState() {
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

  // Fetch currentUser session on mount
  useEffect(() => {
    async function fetchUser() {
      const res = await getCurrentUser()
      if (res.success && res.data) {
        setCurrentUser(res.data as UserProfile)
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
      const data = await getHealthStatus()
      if (data.providers) {
        setLiveProviders(data.providers)
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
        const res = await getPersonalLogs(userProfile.id)

        if (res.success && res.data) {
          const msgs: ChatMessage[] = []
          res.data.forEach((log: any) => {
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
        const res = await getSharedLogs()

        if (!res.success) throw res.error
        setLogs((res.data as any) || [])
      } catch (err) {
        console.error('Failed to fetch AI logs:', err)
      } finally {
        setLoadingLogs(false)
      }
    }

    fetchLogs()

    // Realtime subscription for live additions to logs
    const subscription = subscribeToLogs(async (payload) => {
      const res = await getSingleLogWithRelations(payload.new.id)
      if (res.success && res.data) {
        setLogs((prev) => [res.data as any, ...prev])
      }
    })

    return () => {
      unsubscribeChannel(subscription)
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
        const mems = await getAiMemories(currentUser!.id)
        const sums = await getMemorySummaries()

        if (mems.success) setMemories(mems.data || [])
        if (sums.success) setSummaries(sums.data || [])
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
      const context = personalMessages.slice(-15).map(m => ({
        type: m.type,
        message: m.message
      }))

      const providerPref = typeof window !== 'undefined' ? localStorage.getItem('selected_ai_provider') || 'auto' : 'auto';

      const response = await sendChatMessage(text, null, context, providerPref)

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
    copyToClipboard(text, () => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  // Expand/collapse logs helper
  const toggleExpand = (id: string) => {
    setExpandedLogs(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return {
    activeTab,
    setActiveTab,
    currentUser,
    glowingLogId,
    glowingMemoryId,
    personalPrompt,
    setPersonalPrompt,
    personalMessages,
    isTyping,
    isChatFullscreen,
    setIsChatFullscreen,
    chatEndRef,
    logs,
    setLogs,
    loadingLogs,
    searchQuery,
    setSearchQuery,
    selectedGroup,
    setSelectedGroup,
    selectedUser,
    setSelectedUser,
    copiedId,
    expandedLogs,
    memories,
    summaries,
    loadingMemory,
    selectedProvider,
    modelNameDisplay,
    liveProviders,
    loadingStatus,
    handleProviderChange,
    handleSendPersonal,
    handleCopy,
    toggleExpand
  }
}
