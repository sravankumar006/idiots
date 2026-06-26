import { useState, useEffect } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { ProviderStatus, DiagnosticChecks } from '../types/settings.types'
import {
  getNotificationPreferences,
  getProvidersStatus,
  saveNotificationPreferences,
  triggerTestNotification,
  clearMemory,
  getCurrentUser,
  fetchDeviceStatus as fetchDeviceStatusService,
  fetchNotificationConfig
} from '../services/settings.service'

export function useSettingsState() {
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

  const [providerPreference, setProviderPreference] = useState('auto')
  const [providersStatus, setProvidersStatus] = useState<ProviderStatus[]>([])
  const [loadingProviders, setLoadingProviders] = useState(true)

  const { token, permission, error: pushError, requestPermissionAndRegister } = usePushNotifications()

  // Notification Debug States
  const [swStatus, setSwStatus] = useState<'Connected' | 'Disconnected' | 'Checking...'>('Checking...')
  const [dbTokenStatus, setDbTokenStatus] = useState<'Registered' | 'Missing' | 'Checking...'>('Checking...')
  const [lastRegistrationTime, setLastRegistrationTime] = useState<string | null>(null)
  const [devicePlatform, setDevicePlatform] = useState<string>('Web')
  const [sendingTest, setSendingTest] = useState(false)
  const [repairing, setRepairing] = useState(false)
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  const [activeInstallTab, setActiveInstallTab] = useState<'ios' | 'android'>('ios')

  // Notification Diagnostics States
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [registeredDeviceCount, setRegisteredDeviceCount] = useState<number | null>(null)
  const [runningDiagnostics, setRunningDiagnostics] = useState(false)
  const [diagnosticsRun, setDiagnosticsRun] = useState(false)
  const [diagnosticChecks, setDiagnosticChecks] = useState<DiagnosticChecks>({
    permission: null,
    sw: null,
    firebase: null,
    token: null,
    dbRegistration: null,
    preferences: null,
  })

  useEffect(() => {
    // Load preference from local storage
    const saved = localStorage.getItem('selected_ai_provider')
    if (saved) {
      setProviderPreference(saved)
    }

    // Fetch provider health and statistics dynamically
    async function fetchProvidersStatus() {
      try {
        const res = await getProvidersStatus()
        if (res.success && res.data) {
          setProvidersStatus(res.data.providers || [])
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
        const res = await getNotificationPreferences()
        if (res.success && res.data) {
          const data = res.data
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

  useEffect(() => {
    const fetchUser = async () => {
      const res = await getCurrentUser()
      if (res.success && res.data) {
        setCurrentUserId(res.data.id)
      }
    }
    fetchUser()
  }, [])

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
      const userRes = await getCurrentUser()
      if (!userRes.success || !userRes.data) return
      const user = userRes.data

      const res = await fetchDeviceStatusService(user.id)
      if (!res.success || !res.data) throw res.error
      const devices = res.data

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

    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    setIsMobileDevice(mobileCheck)

    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      setActiveInstallTab('ios')
    } else if (/Android/i.test(navigator.userAgent)) {
      setActiveInstallTab('android')
    }
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

  const handleRunDiagnostics = async () => {
    setRunningDiagnostics(true)
    setDiagnosticsRun(true)
    
    const checks: DiagnosticChecks = {
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
      try {
        const configRes = await fetchNotificationConfig()
        if (configRes.success && configRes.data) {
          const fcmConfig = configRes.data
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
      
      const userRes = await getCurrentUser()
      if (userRes.success && userRes.data) {
        const user = userRes.data
        const res = await fetchDeviceStatusService(user.id)

        if (res.success && res.data) {
          const devices = res.data
          devicesCount = devices.length
          if (token && devices.some((d: any) => d.fcm_token === token)) {
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
        const res = await getNotificationPreferences()
        if (res.success && res.data) {
          const data = res.data
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

  const handleSendTestNotification = async () => {
    setSendingTest(true)
    try {
      const userRes = await getCurrentUser()
      if (!userRes.success || !userRes.data) {
        alert('You must be logged in to send a test notification.')
        return
      }
      const user = userRes.data

      const result = await triggerTestNotification({
        userId: user.id,
        title: 'rocky test notification 🔔',
        body: 'if you see this, push notifications are working perfectly!',
        category: 'chat',
        type: 'test'
      })

      if (result.success && result.data && result.data.notification) {
        alert('Test notification triggered successfully! Check your notification tray and the database.')
      } else {
        alert('Notification endpoint responded successfully, but notification was skipped (likely because chat category is disabled in preferences).')
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
      const res = await saveNotificationPreferences({
        chat_enabled: prefChat,
        focus_enabled: prefFocus,
        ai_enabled: prefAi,
        memory_enabled: prefMemory,
        achievement_enabled: prefAchievement
      })
      if (!res.success) throw res.error
      alert('Preferences saved successfully.')
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
      const userRes = await getCurrentUser()
      if (!userRes.success || !userRes.data) return
      const user = userRes.data

      if (type === 'Current Session') {
        alert('Active session context cleared from local cache.')
      } else {
        const res = await clearMemory(type, user.id)
        if (!res.success) throw res.error
        if (type === 'Conversation Memory') {
          alert('Conversation Memory (Summaries) cleared.')
        } else if (type === 'Project Memory') {
          alert('Project Context Memories cleared.')
        } else if (type === 'Study Memory') {
          alert('Study Context Memories cleared.')
        } else if (type === 'All AI Memory') {
          alert('Complete AI Memory Wipe successful.')
        }
      }
    } catch (err) {
      console.error('Failed to clear memory', err)
      alert('Failed to clear memory. See console for details.')
    }
  }

  return {
    notifications,
    setNotifications,
    audioHandshake,
    setAudioHandshake,
    selectedTheme,
    setSelectedTheme,
    prefChat,
    setPrefChat,
    prefFocus,
    setPrefFocus,
    prefAi,
    setPrefAi,
    prefMemory,
    setPrefMemory,
    prefAchievement,
    setPrefAchievement,
    savingPrefs,
    aiContextEnabled,
    setAiContextEnabled,
    providerPreference,
    setProviderPreference,
    providersStatus,
    loadingProviders,
    swStatus,
    dbTokenStatus,
    lastRegistrationTime,
    devicePlatform,
    sendingTest,
    repairing,
    isMobileDevice,
    activeInstallTab,
    setActiveInstallTab,
    currentUserId,
    registeredDeviceCount,
    runningDiagnostics,
    diagnosticsRun,
    diagnosticChecks,
    pushError,
    token,
    permission,
    handleRepairNotifications,
    handleRunDiagnostics,
    handleSendTestNotification,
    handleSave,
    handleClearMemory
  }
}
