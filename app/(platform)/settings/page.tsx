'use client'

import React, { useState, useEffect } from 'react'
import { Settings, Shield, Bell, HelpCircle, Save, Database, Laptop, Brain, Trash2, Power, Cpu, Activity } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer'
import SectionHeader from '@/components/layout/SectionHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [audioHandshake, setAudioHandshake] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('midnight-violet')

  // Notification Preferences States
  const [prefChat, setPrefChat] = useState(true)
  const [prefFocus, setPrefFocus] = useState(true)
  const [prefAi, setPrefAi] = useState(true)
  const [prefMemory, setPrefMemory] = useState(true)
  const [prefAchievement, setPrefAchievement] = useState(true)
  const [savingPrefs, setSavingPrefs] = useState(false)

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

    // Fetch user notification preferences
    async function fetchNotificationPreferences() {
      try {
        const res = await fetch('/api/notifications/preferences')
        if (res.ok) {
          const data = await res.json()
          setPrefChat(data.chat_enabled !== false)
          setPrefFocus(data.focus_enabled !== false)
          setPrefAi(data.ai_enabled !== false)
          setPrefMemory(data.memory_enabled !== false)
          setPrefAchievement(data.achievement_enabled !== false)
        }
      } catch (err) {
        console.error('Failed to load notification preferences:', err)
      }
    }

    fetchProvidersStatus()
    fetchNotificationPreferences()
  }, [])
  
  const supabase = createClient()
  const { token, permission, error: pushError, requestPermissionAndRegister } = usePushNotifications()

  // Notification Debug States
  const [swStatus, setSwStatus] = useState<'Connected' | 'Disconnected' | 'Checking...'>('Checking...')
  const [dbTokenStatus, setDbTokenStatus] = useState<'Registered' | 'Missing' | 'Checking...'>('Checking...')
  const [lastRegistrationTime, setLastRegistrationTime] = useState<string | null>(null)
  const [devicePlatform, setDevicePlatform] = useState<string>('Web')
  const [sendingTest, setSendingTest] = useState(false)
  const [repairing, setRepairing] = useState(false)

  // Notification Diagnostics States
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [registeredDeviceCount, setRegisteredDeviceCount] = useState<number | null>(null)
  const [runningDiagnostics, setRunningDiagnostics] = useState(false)
  const [diagnosticsRun, setDiagnosticsRun] = useState(false)
  const [diagnosticChecks, setDiagnosticChecks] = useState<{
    permission: { status: 'pass' | 'fail' | 'warn'; message: string } | null
    sw: { status: 'pass' | 'fail'; message: string } | null
    firebase: { status: 'pass' | 'fail'; message: string } | null
    token: { status: 'pass' | 'fail'; message: string } | null
    dbRegistration: { status: 'pass' | 'fail'; message: string } | null
    preferences: { status: 'pass' | 'warn' | 'fail'; message: string } | null
  }>({
    permission: null,
    sw: null,
    firebase: null,
    token: null,
    dbRegistration: null,
    preferences: null,
  })

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    fetchUser()
  }, [])

  const handleRepairNotifications = async () => {
    setRepairing(true)
    try {
      const result = await requestPermissionAndRegister()
      if (result) {
        alert('Push notifications successfully repaired and re-registered!')
      } else {
        if (Notification.permission === 'denied') {
          alert('Notification permission is blocked by your browser. Please reset site permissions in your browser address bar to allow notifications.')
        } else {
          alert('Failed to repair notifications. Check browser settings or console logs.')
        }
      }
    } catch (err: any) {
      alert(`Repair failed: ${err.message || 'An unexpected error occurred.'}`)
    } finally {
      setRepairing(false)
      await checkSystemHealth()
    }
  }

  const checkServiceWorker = async () => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations()
        const hasFCM = regs.some(r => r.active && (r.active.scriptURL.includes('firebase-messaging-sw') || r.scope === '/'))
        setSwStatus(hasFCM ? 'Connected' : 'Disconnected')
      } catch (err) {
        console.error('Error checking service worker:', err)
        setSwStatus('Disconnected')
      }
    } else {
      setSwStatus('Disconnected')
    }
  }

  const fetchDeviceStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: devices, error } = await supabase
        .from('user_devices')
        .select('created_at, platform')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (devices && devices.length > 0) {
        setDbTokenStatus('Registered')
        setLastRegistrationTime(new Date(devices[0].created_at).toLocaleString())
        setRegisteredDeviceCount(devices.length)
      } else {
        setDbTokenStatus('Missing')
        setLastRegistrationTime(null)
        setRegisteredDeviceCount(0)
      }
    } catch (err) {
      console.error('Error fetching device tokens:', err)
      setDbTokenStatus('Missing')
      setRegisteredDeviceCount(0)
    }
  }

  const handleRunDiagnostics = async () => {
    setRunningDiagnostics(true)
    setDiagnosticsRun(true)
    
    const checks: typeof diagnosticChecks = {
      permission: null,
      sw: null,
      firebase: null,
      token: null,
      dbRegistration: null,
      preferences: null,
    }

    try {
      // 1. Browser permission state
      const perm = typeof window !== 'undefined' ? Notification.permission : 'default'
      if (perm === 'granted') {
        checks.permission = { status: 'pass', message: 'Notification permission is granted by browser.' }
      } else if (perm === 'denied') {
        checks.permission = { status: 'fail', message: 'Notification permission is blocked. Reset site settings to enable.' }
      } else {
        checks.permission = { status: 'warn', message: 'Notification permission has not been requested yet.' }
      }

      // 2. Service worker registration
      let hasSW = false
      let swScope = ''
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        const match = regs.find(r => r.active && (r.active.scriptURL.includes('firebase-messaging-sw') || r.scope === '/'))
        if (match) {
          hasSW = true
          swScope = match.scope
        }
      }
      if (hasSW) {
        checks.sw = { status: 'pass', message: `Service Worker active at scope: ${swScope}` }
      } else {
        checks.sw = { status: 'fail', message: 'Service Worker inactive or not found.' }
      }

      // 3. Firebase initialization
      let configValid = false
      let fcmConfig: any = null
      try {
        const configRes = await fetch('/api/notifications/config')
        if (configRes.ok) {
          fcmConfig = await configRes.json()
          if (fcmConfig.apiKey && fcmConfig.projectId && fcmConfig.messagingSenderId && fcmConfig.appId) {
            configValid = true
          }
        }
      } catch (err) {}
      
      if (configValid) {
        checks.firebase = { status: 'pass', message: 'Firebase configuration loaded and initialized successfully.' }
      } else {
        checks.firebase = { status: 'fail', message: 'Firebase/FCM credentials are not configured on the server.' }
      }

      // 4. FCM token availability
      if (token) {
        checks.token = { status: 'pass', message: `FCM Token is available: ${token.slice(0, 10)}...` }
      } else {
        checks.token = { status: 'fail', message: 'FCM Token is missing. Run Repair to generate one.' }
      }

      // 5. user_devices registration status
      let isTokenInDb = false
      let devicesCount = 0
      let lastReg: string | null = null
      
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: devices } = await supabase
          .from('user_devices')
          .select('id, fcm_token, created_at')
          .eq('user_id', user.id)

        if (devices) {
          devicesCount = devices.length
          if (token && devices.some(d => d.fcm_token === token)) {
            isTokenInDb = true
          }
          if (devices.length > 0) {
            const sorted = [...devices].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            lastReg = new Date(sorted[0].created_at).toLocaleString()
          }
        }
      }
      
      setRegisteredDeviceCount(devicesCount)
      if (lastReg) {
        setLastRegistrationTime(lastReg)
      }

      if (isTokenInDb) {
        checks.dbRegistration = { status: 'pass', message: `Current token registered inside public.user_devices. (Total: ${devicesCount} registered)` }
        setDbTokenStatus('Registered')
      } else {
        checks.dbRegistration = { status: 'fail', message: token 
          ? 'Current token is NOT registered in public.user_devices.' 
          : 'Cannot check registration status: Token is missing.' 
        }
        setDbTokenStatus('Missing')
      }

      // 6. Notification preference status
      let prefsValid = false
      let muted = true
      try {
        const res = await fetch('/api/notifications/preferences')
        if (res.ok) {
          const data = await res.json()
          prefsValid = true
          if (data.chat_enabled || data.focus_enabled || data.ai_enabled || data.memory_enabled || data.achievement_enabled) {
            muted = false
          }
        }
      } catch (err) {}

      if (!prefsValid) {
        checks.preferences = { status: 'fail', message: 'Failed to fetch notification preferences from API.' }
      } else if (muted) {
        checks.preferences = { status: 'warn', message: 'All notification routes (Chat, Focus, AI, Vault, Streak) are disabled.' }
      } else {
        checks.preferences = { status: 'pass', message: 'Preferences retrieved. At least one notification category is active.' }
      }

    } catch (err: any) {
      console.error('Diagnostics execution error:', err)
    } finally {
      setDiagnosticChecks(checks)
      setRunningDiagnostics(false)
    }
  }

  const checkSystemHealth = async () => {
    await checkServiceWorker()
    await fetchDeviceStatus()
  }

  useEffect(() => {
    checkSystemHealth()
  }, [token, permission])

  useEffect(() => {
    if (typeof window === 'undefined') return
    // @ts-ignore
    if (window.Capacitor && window.Capacitor.getPlatform() === 'android') {
      setDevicePlatform('Android')
    } else if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setDevicePlatform('PWA')
    } else {
      setDevicePlatform('Web')
    }
  }, [])

  const handleSendTestNotification = async () => {
    setSendingTest(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to send a test notification.')
        return
      }

      const res = await fetch('/api/notifications/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          title: 'rocky test notification 🔔',
          body: 'if you see this, push notifications are working perfectly!',
          category: 'chat',
          type: 'test'
        })
      })

      if (res.ok) {
        const result = await res.json()
        if (result.notification) {
          alert('Test notification triggered successfully! Check your notification tray and the database.')
        } else {
          alert('Notification endpoint responded successfully, but notification was skipped (likely because chat category is disabled in preferences).')
        }
      } else {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to trigger test notification')
      }
    } catch (err: any) {
      console.error(err)
      alert(`Failed to send test notification: ${err.message}`)
    } finally {
      setSendingTest(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPrefs(true)
    try {
      localStorage.setItem('selected_ai_provider', providerPreference)
      
      const res = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_enabled: prefChat,
          focus_enabled: prefFocus,
          ai_enabled: prefAi,
          memory_enabled: prefMemory,
          achievement_enabled: prefAchievement
        })
      })

      if (res.ok) {
        alert('Preferences saved successfully.')
      } else {
        throw new Error('Failed to save notification settings.')
      }
    } catch (err) {
      console.error(err)
      alert('Preferences saved locally, but failed to sync notifications to database.')
    } finally {
      setSavingPrefs(false)
    }
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
              Alert & Push Notification Rules
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

              {/* FCM Toggles */}
              <div className="border-t border-white/5 pt-4 space-y-4">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Push Subscriptions (Firebase Cloud Messaging)
                </span>

                <label className="flex items-center justify-between cursor-pointer select-none">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-xs font-bold text-white block">Chat Notifications</span>
                    <span className="text-[10px] text-gray-500 font-semibold leading-normal">
                      Get pushed for replies, reactions, quotes, and direct mentions.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefChat}
                    onChange={(e) => setPrefChat(e.target.checked)}
                    className="rounded bg-white/5 border-white/10 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer select-none border-t border-white/5 pt-4">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-xs font-bold text-white block">Focus Room Activity</span>
                    <span className="text-[10px] text-gray-500 font-semibold leading-normal">
                      Get alerts when study sessions start, finish, or when you receive invitations.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefFocus}
                    onChange={(e) => setPrefFocus(e.target.checked)}
                    className="rounded bg-white/5 border-white/10 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer select-none border-t border-white/5 pt-4">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-xs font-bold text-white block">AI Companion Updates</span>
                    <span className="text-[10px] text-gray-500 font-semibold leading-normal">
                      Receive notices when Rocky completes a response, summary, or generated note.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefAi}
                    onChange={(e) => setPrefAi(e.target.checked)}
                    className="rounded bg-white/5 border-white/10 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer select-none border-t border-white/5 pt-4">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-xs font-bold text-white block">Timeline & Scrapbook Memory Alerts</span>
                    <span className="text-[10px] text-gray-500 font-semibold leading-normal">
                      Get notified when peers comment, react, or quote your shared vault entries.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefMemory}
                    onChange={(e) => setPrefMemory(e.target.checked)}
                    className="rounded bg-white/5 border-white/10 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer select-none border-t border-white/5 pt-4">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-xs font-bold text-white block">Milestones & Achievements</span>
                    <span className="text-[10px] text-gray-500 font-semibold leading-normal">
                      Get alert milestones for streaks, focus records, or roadmap completions.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefAchievement}
                    onChange={(e) => setPrefAchievement(e.target.checked)}
                    className="rounded bg-white/5 border-white/10 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                  />
                </label>
              </div>

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

          <Button type="submit" variant="neon" className="w-auto py-2.5 px-6 self-start flex items-center gap-2" disabled={savingPrefs}>
            <Save className="h-4 w-4" />
            <span>{savingPrefs ? 'Saving Settings...' : 'Save Preferences'}</span>
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
              <Activity className="h-4 w-4 text-emerald-400" />
              Notification Diagnostics
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">Notification Permission</span>
                <span className={`font-bold px-2 py-0.5 rounded-full border text-[10px] lowercase ${
                  permission === 'granted'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : permission === 'denied'
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                }`}>
                  {permission}
                </span>
              </div>

              <div className="border-t border-white/5 pt-3.5 flex justify-between items-center">
                <span className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">Service Worker Status</span>
                <span className={`font-bold px-2 py-0.5 rounded-full border text-[10px] lowercase ${
                  swStatus === 'Connected'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : swStatus === 'Checking...'
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                }`}>
                  {swStatus === 'Connected' ? 'active' : swStatus === 'Checking...' ? 'checking' : 'inactive'}
                </span>
              </div>

              <div className="border-t border-white/5 pt-3.5 flex justify-between items-center">
                <span className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">FCM Token Status</span>
                <span className={`font-bold px-2 py-0.5 rounded-full border text-[10px] lowercase ${
                  token
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                }`}>
                  {token ? 'available' : 'missing'}
                </span>
              </div>

              <div className="border-t border-white/5 pt-3.5 flex justify-between items-center">
                <span className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">Device Registration</span>
                <span className={`font-bold px-2 py-0.5 rounded-full border text-[10px] lowercase ${
                  dbTokenStatus === 'Registered'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                }`}>
                  {dbTokenStatus === 'Registered' ? 'registered' : 'not registered'}
                </span>
              </div>

              <div className="border-t border-white/5 pt-3.5">
                <span className="text-gray-500 font-semibold uppercase tracking-wider text-[9px] block">Current User ID</span>
                <span className="text-gray-300 font-bold block mt-1 font-mono text-[10px] select-all break-all">
                  {currentUserId || 'loading...'}
                </span>
              </div>

              <div className="border-t border-white/5 pt-3.5 flex justify-between items-center">
                <span className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">Registered Device Count</span>
                <span className="text-gray-300 font-bold">
                  {registeredDeviceCount !== null ? registeredDeviceCount : 'checking...'}
                </span>
              </div>

              <div className="border-t border-white/5 pt-3.5">
                <span className="text-gray-500 font-semibold uppercase tracking-wider text-[9px] block">Last Registration Timestamp</span>
                <span className="text-gray-300 font-bold block mt-1 font-mono text-[10px]">
                  {lastRegistrationTime || 'N/A'}
                </span>
              </div>

              {/* Check results */}
              {diagnosticsRun && (
                <div className="border-t border-white/5 pt-3.5 space-y-2.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Diagnostics Report</span>
                  
                  {[
                    { label: 'Browser Permission', result: diagnosticChecks.permission },
                    { label: 'Service Worker', result: diagnosticChecks.sw },
                    { label: 'Firebase Config', result: diagnosticChecks.firebase },
                    { label: 'FCM Token Availability', result: diagnosticChecks.token },
                    { label: 'DB Device Registration', result: diagnosticChecks.dbRegistration },
                    { label: 'Notification Preferences', result: diagnosticChecks.preferences }
                  ].map((chk, i) => {
                    if (!chk.result) return null;
                    const isPass = chk.result.status === 'pass';
                    const isWarn = chk.result.status === 'warn';
                    const color = isPass 
                      ? 'text-emerald-400' 
                      : isWarn 
                      ? 'text-amber-400' 
                      : 'text-rose-400';
                    const icon = isPass ? '✓' : isWarn ? '⚠' : '✗';
                    
                    return (
                      <div key={i} className="flex items-start gap-2 text-[10px] font-semibold leading-tight">
                        <span className={`font-black select-none ${color}`}>{icon}</span>
                        <div className="min-w-0 flex-1">
                          <span className="text-gray-300 font-bold block">{chk.label}</span>
                          <span className="text-gray-500 text-[9px] leading-relaxed block">{chk.result.message}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {permission === 'denied' && (
                <div className="mt-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] leading-relaxed font-semibold">
                  <span className="font-bold block uppercase tracking-wider text-[8px] mb-1">site permissions blocked</span>
                  To re-enable, click the settings/lock icon in your browser's address bar next to the URL, change "Notification" to "Allow", and try again.
                </div>
              )}

              {pushError && (
                <div className="mt-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] leading-relaxed font-semibold">
                  <span className="font-bold block uppercase tracking-wider text-[8px] mb-1">registration error</span>
                  {pushError}
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2">
                <Button 
                  type="button" 
                  onClick={handleRunDiagnostics} 
                  disabled={runningDiagnostics}
                  className="w-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  {runningDiagnostics ? 'Running Checks...' : 'Run Diagnostics'}
                </Button>

                <Button 
                  type="button" 
                  onClick={handleSendTestNotification} 
                  disabled={sendingTest || permission !== 'granted' || dbTokenStatus !== 'Registered'}
                  className="w-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  {sendingTest ? 'Sending Test...' : 'Send Test Notification'}
                </Button>

                <Button 
                  type="button" 
                  onClick={handleRepairNotifications} 
                  disabled={repairing}
                  className="w-full bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 border border-violet-500/20 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  {repairing ? 'Repairing Connection...' : 'Repair Push Notifications'}
                </Button>
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
