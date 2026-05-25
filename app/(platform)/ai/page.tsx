'use client'

import React, { useState, useEffect } from 'react'
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
  Trash2,
  Calendar,
  Terminal,
  Activity
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface LogItem {
  id: string
  prompt: string
  response: string
  model: string
  created_at: string
  room_id: string | null
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

export default function AiLogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({})

  const supabase = createClient()

  // Fetch logs on mount
  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('ai_logs')
          .select(`
            id,
            prompt,
            response,
            model,
            created_at,
            room_id,
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
        setLoading(false)
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

  // Helper: Copy response
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }).catch(err => console.error('Copy failed', err))
  }

  // Toggle expanded view
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

  // Filter logs based on inputs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.response.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesGroup = selectedGroup === 'all' || log.room_id === selectedGroup
    const matchesUser = selectedUser === 'all' || log.profiles?.id === selectedUser

    return matchesSearch && matchesGroup && matchesUser
  })

  // Group metrics
  const totalQueries = logs.length
  const activeRoomsCount = new Set(logs.filter(l => l.room_id).map(l => l.room_id)).size
  const activeUsersCount = new Set(logs.filter(l => l.profiles?.id).map(l => l.profiles?.id)).size
  
  // Calculate average length of AI responses (simple proxy metric)
  const averageLength = totalQueries > 0 
    ? Math.round(logs.reduce((sum, log) => sum + log.response.length, 0) / totalQueries)
    : 0

  return (
    <PageContainer>
      <SectionHeader 
        title="companion archive" 
        description="A real-time searchable index of all shared intelligence, companion queries, and synthesis logs."
      />

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 select-none">
        <Card className="p-5 flex items-center justify-between hover:border-violet-500/10">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Total Queries</span>
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-rose-400">
              {loading ? '...' : totalQueries}
            </span>
          </div>
          <Activity className="h-6 w-6 text-violet-400/60" />
        </Card>

        <Card className="p-5 flex items-center justify-between hover:border-cyan-500/10">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Active Rooms</span>
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              {loading ? '...' : activeRoomsCount}
            </span>
          </div>
          <MessageSquare className="h-6 w-6 text-cyan-400/60" />
        </Card>

        <Card className="p-5 flex items-center justify-between hover:border-emerald-500/10">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Involved Friends</span>
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              {loading ? '...' : activeUsersCount}
            </span>
          </div>
          <User className="h-6 w-6 text-emerald-400/60" />
        </Card>

        <Card className="p-5 flex items-center justify-between hover:border-amber-500/10">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Avg Output Size</span>
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">
              {loading ? '...' : `${averageLength} chars`}
            </span>
          </div>
          <Terminal className="h-6 w-6 text-amber-400/60" />
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-2">
        {/* Search */}
        <div className="lg:col-span-2 relative flex items-center">
          <Search className="absolute left-4 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search prompt or response contents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0b15]/40 glass-panel border border-black/5 dark:border-white/5 rounded-2xl py-3 pl-11 pr-4 text-xs text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/30 transition-all font-semibold"
          />
        </div>

        {/* Group Filter */}
        <div className="relative flex items-center">
          <Filter className="absolute left-4 h-4 w-4 text-gray-500" />
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full appearance-none bg-[#0a0b15]/40 glass-panel border border-black/5 dark:border-white/5 rounded-2xl py-3 pl-11 pr-4 text-xs text-gray-700 dark:text-gray-300 font-semibold focus:outline-none focus:border-violet-500/30 transition-all cursor-pointer"
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
            className="w-full appearance-none bg-[#0a0b15]/40 glass-panel border border-black/5 dark:border-white/5 rounded-2xl py-3 pl-11 pr-4 text-xs text-gray-700 dark:text-gray-300 font-semibold focus:outline-none focus:border-violet-500/30 transition-all cursor-pointer"
          >
            <option value="all">all users</option>
            {uniqueUsers.map(([id, name]) => (
              <option key={id} value={id}>{name.toLowerCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Logs Chronology */}
      <div className="space-y-4 mt-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 select-none">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center animate-spin">
              <Sparkles className="h-5 w-5 text-violet-400" />
            </div>
            <span className="text-xs font-semibold text-gray-500 tracking-wider">synchronizing local companion logs...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <Card className="flex flex-col items-center justify-center text-center py-24 select-none border border-black/5 dark:border-white/5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-violet-500/10 to-rose-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-violet-400 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">No companion logs found</h3>
            <p className="text-xs text-gray-500 max-w-sm font-semibold leading-relaxed">
              {searchQuery || selectedGroup !== 'all' || selectedUser !== 'all'
                ? "Try adjusting your query or filter parameters to locate the recorded items."
                : "Ask queries to the AI directly inside any room chat using @ai to populate the logs archive."
              }
            </p>
          </Card>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogs[log.id] || false
            const isLong = log.response.length > 500
            const displayResponse = isExpanded || !isLong 
              ? log.response 
              : `${log.response.substring(0, 500)}...`

            const avatarId = log.profiles?.avatar || 'avatar-cyber-ghost'
            const avatar = AVATAR_MAP[avatarId] || AVATAR_MAP['avatar-cyber-ghost']

            const timeFormatted = new Date(log.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })

            return (
              <Card 
                key={log.id} 
                className="p-6 md:p-8 space-y-5 hover:border-white/10 shadow-sm border border-black/5 dark:border-white/5 relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.03)]"
              >
                {/* Log Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    {/* User avatar who queried */}
                    <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${avatar.gradient} flex items-center justify-center text-[10px] font-semibold text-white select-none`}>
                      {avatar.symbol}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                          {log.profiles?.username || 'explorer'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full border border-black/5 dark:border-white/5">
                          {log.groups ? `#${log.groups.group_name}` : 'direct query'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold select-none">
                        <Clock className="h-3 w-3" />
                        <span>{timeFormatted}</span>
                      </div>
                    </div>
                  </div>

                  {/* Model badge and actions */}
                  <div className="flex items-center gap-2 select-none">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-xl border border-violet-500/20">
                      <Cpu className="h-3 w-3" />
                      {log.model}
                    </span>

                    <button
                      onClick={() => handleCopy(log.id, log.response)}
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
                <div className="bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl p-4 space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block select-none">Query prompt</span>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {log.prompt}
                  </p>
                </div>

                {/* Response Section */}
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
              </Card>
            )
          })
        )}
      </div>
    </PageContainer>
  )
}
