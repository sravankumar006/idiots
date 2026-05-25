'use client'

import React, { useState } from 'react'
import { Sparkles, Brain, Cpu, MessageSquare, ArrowRight, CornerDownLeft } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'

export default function AiPage() {
  const [prompt, setPrompt] = useState('')
  const [conversations, setConversations] = useState([
    {
      role: 'assistant',
      text: 'Greetings. I am your IS AI Companion. I can assist you in compiling research summaries, managing focus targets, indexing Mind Logs, or drafting concepts. How shall we begin?'
    }
  ])
  const [isTyping, setIsTyping] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    const userPrompt = prompt.trim()
    setConversations((prev) => [...prev, { role: 'user', text: userPrompt }])
    setPrompt('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false)
      setConversations((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Understood. Analyzing request: "${userPrompt}". Mind indexing engines are ready. Once the full-stack database triggers and API endpoints are established, I will deliver live responses. Let's build something awesome!`
        }
      ])
    }, 1500)
  }

  const presets = [
    'Summarize my recent Focus hours',
    'Synthesize Next.js 16 proxy concepts',
    'Review IS Mind Logs indexing',
    'Draft a project proposal for Creative Rooms'
  ]

  return (
    <PageContainer>
      <SectionHeader 
        title="IS AI" 
        description="Collaborate with your local companion node for synthesis, learning, and automation."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Presets and Status column */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu className="h-4 w-4 text-violet-400" />
              Companion Diagnostics
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Engine Version</span>
                <span className="text-gray-300 font-bold">IS-v1.4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Latency Status</span>
                <span className="text-emerald-400 font-bold">12ms (Offline Core)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Context Usage</span>
                <span className="text-violet-300 font-bold">1,240 / 32k tokens</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Brain className="h-4 w-4 text-rose-400" />
              Suggested Triggers
            </h3>
            <div className="space-y-2">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(preset)}
                  className="w-full text-left p-2.5 rounded-xl bg-white/2 hover:bg-white/5 border border-white/5 text-[11px] font-semibold text-gray-400 hover:text-white transition-all cursor-pointer truncate"
                >
                  {preset}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* AI Dialog Stream Column */}
        <div className="lg:col-span-2 flex flex-col h-[550px]">
          <Card className="flex-1 p-0 flex flex-col overflow-hidden">
            
            {/* Thread Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {conversations.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex gap-3 max-w-xl animate-fadeIn ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black text-black shadow-md shrink-0 ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-violet-500 to-rose-400' 
                      : 'bg-gradient-to-br from-cyan-400 to-blue-500'
                  }`}>
                    {msg.role === 'user' ? 'ME' : 'AI'}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-500">
                      {msg.role === 'user' ? 'You' : 'IS AI'}
                    </span>
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed border ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-br from-violet-500/15 via-rose-500/10 to-transparent text-white border-violet-500/20 rounded-tr-none' 
                        : 'bg-white/5 text-gray-300 border-white/5 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 max-w-xl animate-pulse">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xs font-black text-black shrink-0">
                    AI
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-500">IS AI</span>
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5 rounded-tl-none flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Prompt Box */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 shrink-0 bg-[#0a0b15]/40">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Consult IS AI Companion..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isTyping}
                  className="w-full bg-white/2 border border-white/5 rounded-xl py-3.5 pl-4 pr-16 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/40 transition-all font-semibold"
                />
                <button
                  type="submit"
                  disabled={isTyping}
                  className="absolute right-2 py-1.5 px-3 rounded-lg bg-violet-500/15 hover:bg-violet-500/30 border border-violet-500/25 text-violet-300 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                >
                  <span>Query</span>
                  <CornerDownLeft className="h-3 w-3" />
                </button>
              </div>
            </form>

          </Card>
        </div>

      </div>
    </PageContainer>
  )
}
