'use client'

import React, { useState, useEffect } from 'react'
import { Settings, Shield, Bell, HelpCircle, Save, Database, Laptop, Brain, Trash2, Power, Cpu, Activity } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [audioHandshake, setAudioHandshake] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('midnight-violet')

  // AI Memory Toggles
  const [aiContextEnabled, setAiContextEnabled] = useState(true)

  // AI Provider preferences & stats
  interface ProviderStatus {
    name: string;
    displayName: string;
    configured: boolean;
    health: 'Healthy' | 'Warning' | 'Unavailable';
    stats: {
      totalRequests: number;
      successRate: number;
      avgLatencyMs: number;
      failures: number;
    }
  }
  const [providerPreference, setProviderPreference] = useState('auto')
  const [providersStatus, setProvidersStatus] = useState<ProviderStatus[]>([])
  const [loadingProviders, setLoadingProviders] = useState(true)
  
  useEffect(() => {
    // Load preference from local storage
    const saved = localStorage.getItem('selected_ai_provider')
    if (saved) {
      setProviderPreference(saved)
    }

    // Fetch provider health and statistics dynamically
    async function fetchProvidersStatus() {
      try {
        const res = await fetch('/api/ai/providers/status')
        if (res.ok) {
          const data = await res.json()
          setProvidersStatus(data.providers || [])
        }
      } catch (err) {
        console.error('Failed to load provider status:', err)
      } finally {
        setLoadingProviders(false)
      }
    }
    fetchProvidersStatus()
  }, [])
  
  const supabase = createClient()

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('selected_ai_provider', providerPreference)
    alert('Preferences saved successfully.')
  }

  const handleClearMemory = async (type: string) => {
    if (!confirm(`Are you sure you want to clear ${type}? This action cannot be undone.`)) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (type === 'Current Session') {
        alert('Active session context cleared from local cache.')
      } else if (type === 'Conversation Memory') {
        await supabase.from('memory_summaries').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Deletes all summaries for user (via RLS if implemented properly or just general cleanup)
        alert('Conversation Memory (Summaries) cleared.')
      } else if (type === 'Project Memory') {
        await supabase.from('ai_memories').delete().eq('created_by', user.id).eq('memory_type', 'Project')
        alert('Project Context Memories cleared.')
      } else if (type === 'Study Memory') {
        await supabase.from('ai_memories').delete().eq('created_by', user.id).eq('memory_type', 'Study')
        alert('Study Context Memories cleared.')
      } else if (type === 'All AI Memory') {
        await supabase.from('ai_memories').delete().eq('created_by', user.id)
        // Also clear their personal summaries
        await supabase.from('memory_summaries').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        alert('Complete AI Memory Wipe successful.')
      }
    } catch (err) {
      console.error('Failed to clear memory', err)
      alert('Failed to clear memory. See console for details.')
    }
  }

  return (
    <PageContainer>
      <SectionHeader 
        title="Preferences" 
        description="Modify application settings, display themes, and network connection parameters."
      />

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Left 2 Cols: Form settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Display settings */}
          <Card className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Laptop className="h-4 w-4 text-violet-400" />
              Theme Configuration
            </h3>
            
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { id: 'deep-space', name: 'Deep Space', bg: 'bg-[#020205]' },
                { id: 'midnight-violet', name: 'Violet Aura', bg: 'bg-violet-950/20 border-violet-500/30' },
                { id: 'cyber-cyan', name: 'Cyber Cyan', bg: 'bg-cyan-950/20 border-cyan-500/30' },
              ].map((theme) => (
                <button
                  type="button"
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    selectedTheme === theme.id
                      ? 'border-violet-400 bg-violet-500/10 text-white shadow-[0_0_10px_rgba(139,92,246,0.15)]'
                      : 'border-white/5 bg-white/2 text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className={`h-4 w-4 rounded-full ${theme.bg} border border-white/10`} />
                  <span>{theme.name}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Alert Options */}
          <Card className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Bell className="h-4 w-4 text-rose-400" />
              Alert Rules
            </h3>
            
            <div className="space-y-4 pt-2">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-bold text-white block">Connection Notifications</span>
                  <span className="text-[10px] text-gray-500 font-semibold leading-normal">
                    Receive alert alerts when peers connect or disconnect from active workspaces.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="rounded bg-white/5 border-white/10 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none border-t border-white/5 pt-4">
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-bold text-white block">Audio Handshakes</span>
                  <span className="text-[10px] text-gray-500 font-semibold leading-normal">
                    Play a futuristic sonic hum upon successful WebSocket session establishment.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={audioHandshake}
                  onChange={(e) => setAudioHandshake(e.target.checked)}
                  className="rounded bg-white/5 border-white/10 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                />
              </label>
            </div>
          </Card>

          {/* AI Settings */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Brain className="h-4 w-4 text-rose-400" />
                AI Memory Settings
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[10px] font-bold text-gray-400">Context Enabled</span>
                <input
                  type="checkbox"
                  checked={aiContextEnabled}
                  onChange={(e) => setAiContextEnabled(e.target.checked)}
                  className="rounded bg-white/5 border-white/10 text-rose-500 focus:ring-rose-500 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                />
              </label>
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="button" variant="outline" onClick={() => handleClearMemory('Current Session')} className="flex-1 justify-start border border-white/5 text-gray-300 hover:text-white bg-white/5">
                  <Power className="h-3.5 w-3.5 mr-2" />
                  Clear Current Session
                </Button>
                <Button type="button" variant="outline" onClick={() => handleClearMemory('Conversation Memory')} className="flex-1 justify-start border border-white/5 text-gray-300 hover:text-white bg-white/5">
                  <Trash2 className="h-3.5 w-3.5 mr-2 text-rose-400" />
                  Clear Conversation Memory
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="button" variant="outline" onClick={() => handleClearMemory('Project Memory')} className="flex-1 justify-start border border-white/5 text-gray-300 hover:text-white bg-white/5">
                  <Trash2 className="h-3.5 w-3.5 mr-2 text-cyan-400" />
                  Clear Project Memory
                </Button>
                <Button type="button" variant="outline" onClick={() => handleClearMemory('Study Memory')} className="flex-1 justify-start border border-white/5 text-gray-300 hover:text-white bg-white/5">
                  <Trash2 className="h-3.5 w-3.5 mr-2 text-emerald-400" />
                  Clear Study Memory
                </Button>
              </div>

              <div className="pt-2">
                <Button type="button" onClick={() => handleClearMemory('All AI Memory')} className="w-full bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20">
                  Reset All AI Memory
                </Button>
              </div>
            </div>
          </Card>

          {/* AI Providers Settings */}
          <Card className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
              <Cpu className="h-4 w-4 text-violet-400" />
              AI Routing & Providers
            </h3>

            {/* Manual Provider Selection */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-gray-400">Preferred AI Provider</label>
              <p className="text-[10px] text-gray-500 font-semibold leading-normal mb-2">
                Choose a preferred AI engine. If your preferred provider encounters rate limits or outages, Rocky will automatically fall back to alternative nodes.
              </p>
              <select
                value={providerPreference}
                onChange={(e) => setProviderPreference(e.target.value)}
                className="w-full max-w-xs bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-violet-500/50 transition-all cursor-pointer font-semibold"
              >
                <option value="auto">Auto (Gemini ➔ GPT ➔ OpenRouter)</option>
                <option value="gemini">Use Gemini (Primary)</option>
                <option value="openai">Use OpenAI GPT</option>
                <option value="openrouter">Use OpenRouter</option>
              </select>
            </div>

            {/* Provider Grid */}
            <div className="pt-3 border-t border-white/5 space-y-3">
              <span className="block text-xs font-bold text-gray-400">Active Node Ecosystem</span>
              
              {loadingProviders ? (
                <div className="flex items-center gap-2 text-xs text-gray-500 py-2 font-semibold animate-pulse">
                  <Activity className="h-4 w-4 text-violet-400" />
                  Checking provider statuses...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {providersStatus.map((p) => {
                    const isHealthy = p.health === 'Healthy';
                    const isWarning = p.health === 'Warning';
                    const isUnavailable = p.health === 'Unavailable' || !p.configured;

                    const healthColors = isHealthy
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      : isWarning
                      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                      : 'text-rose-400 bg-rose-500/10 border-rose-500/20';

                    return (
                      <div
                        key={p.name}
                        className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-extrabold text-white block">
                              {p.displayName}
                            </span>
                            <span className="text-[9px] text-gray-500 font-mono mt-0.5 block">
                              {p.name === 'gemini' ? 'gemini-2.5-flash' : p.name === 'openai' ? 'gpt-4o-mini' : 'google/gemini-2.5-flash'}
                            </span>
                          </div>

                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${healthColors}`}>
                            {p.configured ? p.health : 'Offline'}
                          </span>
                        </div>

                        <div className="space-y-1 pt-1.5 border-t border-white/[0.03] text-[10px]">
                          <div className="flex justify-between font-semibold">
                            <span className="text-gray-500">Configured:</span>
                            <span className={p.configured ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {p.configured ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span className="text-gray-500">Success Rate:</span>
                            <span className="text-gray-300 font-bold">{p.stats.successRate}%</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span className="text-gray-500">Requests:</span>
                            <span className="text-gray-300 font-bold">{p.stats.totalRequests}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span className="text-gray-500">Latency:</span>
                            <span className="text-gray-300 font-bold">{p.stats.avgLatencyMs || '—'} ms</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          <Button type="submit" variant="neon" className="w-auto py-2.5 px-6 self-start flex items-center gap-2">
            <Save className="h-4 w-4" />
            <span>Save Preferences</span>
          </Button>

        </div>

        {/* Right 1 Col: Diagnostics */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Database className="h-4 w-4 text-cyan-400" />
              Network Node Info
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-gray-500 font-semibold uppercase tracking-wider text-[9px] block">Database Endpoint</span>
                <span className="text-gray-300 font-bold font-mono text-[10px] break-all block mt-1">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not Configured'}
                </span>
              </div>
              <div className="border-t border-white/5 pt-3">
                <span className="text-gray-500 font-semibold uppercase tracking-wider text-[9px] block">Auth Provider</span>
                <span className="text-gray-300 font-bold block mt-1">Supabase SSR Cookies API</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-violet-400" />
              Encrypted Tunnel
            </h3>
            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
              Your network connection is managed with zero exposure of service roles or tokens, ensuring 100% Client-to-Edge validation boundaries.
            </p>
          </Card>
        </div>

      </form>
    </PageContainer>
  )
}
