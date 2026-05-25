'use client'

import React, { useState } from 'react'
import { Settings, Shield, Bell, HelpCircle, Save, Database, Laptop } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [audioHandshake, setAudioHandshake] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('midnight-violet')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Preferences saved successfully.')
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
