'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Sparkles, Search, Filter, Hash, Brain, Copy, Check, Clock, Cpu } from 'lucide-react'
import { UserProfile, ChatMessage } from '@/types'
import { useTheme } from 'next-themes'
import useMessages from '@/hooks/useMessages'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card } from '@/components/ui/Card'
import DragDropZone from './DragDropZone'
import UploadButton from './UploadButton'
import FilePreview from './FilePreview'

// Avatar palette
const AVATAR_MAP: Record<string, { gradient: string; symbol: string }> = {
  'avatar-cyber-ghost':  { gradient: 'from-indigo-400 to-purple-500',  symbol: 'CM' },
  'avatar-neon-pulse':   { gradient: 'from-purple-400 to-pink-500',    symbol: 'SL' },
  'avatar-alpha-wing':   { gradient: 'from-emerald-400 to-teal-500',   symbol: 'MM' },
  'avatar-solar-flare':  { gradient: 'from-orange-300 to-rose-400',    symbol: 'WP' },
  'avatar-void-runner':  { gradient: 'from-rose-400 to-pink-500',      symbol: 'CB' },
  'avatar-shadow-blade': { gradient: 'from-slate-400 to-indigo-500',   symbol: 'MS' },
}

const CATEGORIES = ['General', 'Study', 'Coding', 'Research', 'Projects']

interface SharedAILogsRoomProps {
  groupId: string
  activeUser: UserProfile | null
  onBack?: () => void
}

export default function SharedAILogsRoom({ groupId, activeUser, onBack }: SharedAILogsRoomProps) {
  const { theme } = useTheme()
  const { messages, isLoading, sendMessage } = useMessages(groupId, activeUser)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All')
  
  const [promptText, setPromptText] = useState('')
  const [selectedPromptCategory, setSelectedPromptCategory] = useState('General')
  const [draftFile, setDraftFile] = useState<File | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatEndRef.current && !searchQuery && selectedCategoryFilter === 'All') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!promptText.trim() && !draftFile) || isTyping) return
    
    setIsTyping(true)
    
    let fileType = 'document'
    if (draftFile) {
      if (draftFile.type.startsWith('image/')) fileType = 'image'
      else if (draftFile.type.startsWith('video/')) fileType = 'video'
      else if (draftFile.type === 'application/pdf') fileType = 'pdf'
    }

    try {
      // Overload sendMessage to pass category? 
      // Wait, useMessages doesn't currently accept category natively. 
      // We will just prepend it or use a trick, OR we can update useMessages to take category.
      // For now, let's update useMessages slightly to accept category.
      
      const fileInfo = draftFile ? { file: draftFile, type: fileType } : undefined
      await sendMessage(promptText, fileInfo, true, selectedPromptCategory)
      
      setPromptText('')
      setDraftFile(null)
    } finally {
      setIsTyping(false)
    }
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  // Filter pairs
  // In a real shared room, AI responds directly. We'll show all messages in a linear feed.
  const filteredMessages = messages.filter(m => {
    if (m.type === 'deleted') return false
    
    const textMatch = m.message.toLowerCase().includes(searchQuery.toLowerCase())
    const catMatch = selectedCategoryFilter === 'All' || m.category === selectedCategoryFilter
    return textMatch && catMatch
  })

  return (
    <DragDropZone onFileDrop={setDraftFile}>
      <div className="flex flex-col h-full bg-[#faf9f6] dark:bg-[#0a0b15] relative overflow-hidden">
        
        {/* Header */}
        <header className="relative z-10 flex items-center justify-between gap-3 px-4 h-14 shrink-0 backdrop-blur-xl border-b bg-[#faf9f6]/80 dark:bg-[#0a0b15]/80 border-black/5 dark:border-white/[0.05]">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="md:hidden flex items-center justify-center h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-500">
                <ArrowLeft className="h-4.5 w-4.5" />
              </button>
            )}
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-violet-500 to-rose-500 flex items-center justify-center text-white shadow-sm shrink-0">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                Companion Node
                <span className="text-[9px] font-bold bg-violet-500/10 text-violet-500 px-1.5 py-0.5 rounded-md">SHARED</span>
              </p>
            </div>
          </div>
        </header>

        {/* Workspace Toolbar */}
        <div className="p-4 border-b border-black/5 dark:border-white/[0.05] bg-white/50 dark:bg-[#0f0f12]/50 backdrop-blur-md z-10 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto">
            <div className="sm:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search the group's AI knowledge base..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-[#16181d] border border-black/5 dark:border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-violet-500/30 transition-all font-medium"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-[#16181d] border border-black/5 dark:border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-700 dark:text-gray-300 font-semibold focus:outline-none focus:border-violet-500/30 transition-all cursor-pointer"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Chat / Logs */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-4xl mx-auto space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center animate-spin">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                </div>
                <span className="text-xs font-semibold text-gray-500">Syncing shared intelligence...</span>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-16 w-16 rounded-3xl bg-gradient-to-tr from-violet-500/10 to-rose-500/10 flex items-center justify-center mb-6">
                  <Brain className="h-8 w-8 text-violet-400 opacity-80" />
                </div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-2">Welcome to the Companion Node</h3>
                <p className="text-xs text-gray-500 max-w-sm font-medium leading-relaxed">
                  This is the group's shared AI workspace. Prompts and responses generated here are visible to everyone and permanently stored as a collaborative knowledge base.
                </p>
              </div>
            ) : (
              filteredMessages.map((msg, idx) => {
                const isAI = msg.type === 'ai'
                const isSelf = msg.sender_id === activeUser?.id
                const avatarId = msg.profiles?.avatar || 'avatar-cyber-ghost'
                const avatar = AVATAR_MAP[avatarId] || AVATAR_MAP['avatar-cyber-ghost']
                const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                return (
                  <Card key={msg.id || idx} className={`p-4 sm:p-6 transition-all border ${isAI ? 'bg-white dark:bg-[#16181d] border-indigo-500/20 shadow-[0_4px_20px_rgba(99,102,241,0.03)]' : 'bg-gray-50 dark:bg-white/[0.02] border-black/5 dark:border-white/5 shadow-sm'}`}>
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className={`h-10 w-10 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-sm ${isAI ? 'bg-gradient-to-br from-indigo-500 to-purple-500' : 'bg-gradient-to-br ' + avatar.gradient}`}>
                        {isAI ? <Sparkles className="h-5 w-5 text-white" /> : avatar.symbol}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {isAI ? 'Rocky' : (msg.profiles?.username || 'Explorer')}
                            </span>
                            <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {timeStr}
                            </span>
                            {msg.category && msg.category !== 'General' && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest bg-violet-500/10 text-violet-500 border border-violet-500/20">
                                {msg.category}
                              </span>
                            )}
                          </div>
                          {isAI && (
                            <button
                              onClick={() => handleCopy(msg.id, msg.message)}
                              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
                            >
                              {copiedId === msg.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                            </button>
                          )}
                        </div>

                        {/* File preview if user attached one */}
                        {msg.file_url && msg.type !== 'ai' && (
                          <div className="inline-flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-black/20 border border-black/5 dark:border-white/5">
                            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-[10px] font-bold uppercase">
                              {msg.type}
                            </div>
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{msg.file_name || 'attachment'}</span>
                          </div>
                        )}

                        <div className={`text-sm leading-relaxed ${isAI ? 'text-gray-800 dark:text-gray-200' : 'text-gray-700 dark:text-gray-300'} break-words`}>
                          {isAI ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-code:text-indigo-300">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.message}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.message}</p>
                          )}
                        </div>

                        {/* Sending indicator */}
                        {msg.sending && (
                          <div className="flex items-center gap-1.5 pt-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="shrink-0 px-4 pb-4 pt-2 bg-gradient-to-t from-[#faf9f6] via-[#faf9f6] to-transparent dark:from-[#0a0b15] dark:via-[#0a0b15] relative z-10">
          <div className="max-w-4xl mx-auto">
            <FilePreview file={draftFile} onRemove={() => setDraftFile(null)} />
            
            <form onSubmit={handleSend} className="bg-white dark:bg-[#16181d] border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] rounded-2xl flex flex-col overflow-hidden transition-all focus-within:ring-2 focus-within:ring-violet-500/50">
              
              {/* Toolbar */}
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50/50 dark:bg-white/[0.02] border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <select
                    value={selectedPromptCategory}
                    onChange={e => setSelectedPromptCategory(e.target.value)}
                    className="appearance-none bg-transparent text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 focus:outline-none cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-center">
                  <UploadButton onFileSelect={setDraftFile} disabled={isTyping} onSendSticker={() => {}} />
                </div>
              </div>

              {/* Textarea */}
              <div className="flex items-end p-2 gap-2">
                <textarea
                  value={promptText}
                  onChange={e => setPromptText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend(e as any)
                    }
                  }}
                  placeholder="Collaborate with Rocky... (use shift+enter for new line)"
                  className="flex-1 bg-transparent border-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 resize-none px-2 py-1.5 max-h-[200px] min-h-[44px]"
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  disabled={(!promptText.trim() && !draftFile) || isTyping}
                  className="flex items-center justify-center h-10 w-10 rounded-xl bg-violet-500 hover:bg-violet-600 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
                >
                  <Sparkles className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </DragDropZone>
  )
}
