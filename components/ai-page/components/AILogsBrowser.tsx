import React from 'react'
import { Activity, MessageSquare, User, Terminal, Search, Filter, Clock, Cpu, Check, Copy, Sparkles, Brain } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card } from '@/components/ui/Card'
import { LogItem } from '../types/ai-page.types'

interface AILogsBrowserProps {
  logs: LogItem[]
  loadingLogs: boolean
  searchQuery: string
  setSearchQuery: (q: string) => void
  selectedGroup: string
  setSelectedGroup: (g: string) => void
  selectedUser: string
  setSelectedUser: (u: string) => void
  copiedId: string | null
  expandedLogs: Record<string, boolean>
  glowingLogId: string | null
  handleCopy: (id: string, text: string) => void
  toggleExpand: (id: string) => void
  avatarMap: Record<string, { gradient: string; symbol: string }>
}

export default function AILogsBrowser({
  logs,
  loadingLogs,
  searchQuery,
  setSearchQuery,
  selectedGroup,
  setSelectedGroup,
  selectedUser,
  setSelectedUser,
  copiedId,
  expandedLogs,
  glowingLogId,
  handleCopy,
  toggleExpand,
  avatarMap
}: AILogsBrowserProps) {
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

  return (
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
          <Card className="flex flex-col items-center justify-center text-center py-24 select-none border-none animate-fadeIn">
            <div className="h-12 w-12 rounded-2xl neo-inset-panel border-none flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-[#5E4545] dark:text-[#ffb4b4] animate-pulse" />
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
            const avatar = avatarMap[avatarId] || avatarMap['avatar-cyber-ghost']

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
  )
}
