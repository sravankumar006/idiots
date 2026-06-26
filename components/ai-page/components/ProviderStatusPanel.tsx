import React from 'react'
import { Settings, Activity, Brain } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface ProviderStatusPanelProps {
  selectedProvider: string
  handleProviderChange: (p: string) => void
  modelNameDisplay: string
  liveProviders: any[]
  loadingStatus: boolean
  setPersonalPrompt: (p: string) => void
  isChatFullscreen: boolean
}

const PRESETS = [
  'Help me map out a database schema for user profiles',
  'Review key design concepts of glassmorphic styling',
  'Synthesize a project proposal structure',
  'Generate a funny joke about programmer bugs'
]

export default function ProviderStatusPanel({
  selectedProvider,
  handleProviderChange,
  modelNameDisplay,
  liveProviders,
  loadingStatus,
  setPersonalPrompt,
  isChatFullscreen
}: ProviderStatusPanelProps) {
  if (isChatFullscreen) return null

  return (
    <div className="space-y-4 select-none">
      {/* AI Config & Settings Panel */}
      <Card className="p-6 space-y-4 hover:border-violet-500/10">
        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
          <Settings className="h-4 w-4 text-[#5E4545] dark:text-[#ffb4b4]" />
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
            <label htmlFor="provider-selector" className="text-gray-500 font-semibold block">Preferred Provider</label>
            <select
              id="provider-selector"
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
        
        <div className="space-y-4">
          {liveProviders.length === 0 ? (
            <p className="text-[11px] text-gray-500 font-semibold leading-relaxed animate-pulse">
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
          {PRESETS.map((preset, idx) => (
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
  )
}
