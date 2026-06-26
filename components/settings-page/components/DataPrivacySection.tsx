import React from 'react'
import { Brain, Power, Trash2, Cpu, Activity } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProviderStatus } from '../types/settings.types'

interface DataPrivacySectionProps {
  aiContextEnabled: boolean
  setAiContextEnabled: (val: boolean) => void
  handleClearMemory: (type: string) => void
  providerPreference: string
  setProviderPreference: (val: string) => void
  loadingProviders: boolean
  providersStatus: ProviderStatus[]
}

export default function DataPrivacySection({
  aiContextEnabled,
  setAiContextEnabled,
  handleClearMemory,
  providerPreference,
  setProviderPreference,
  loadingProviders,
  providersStatus
}: DataPrivacySectionProps) {
  return (
    <>
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
                )
              })}
            </div>
          )}
        </div>
      </Card>
    </>
  )
}
