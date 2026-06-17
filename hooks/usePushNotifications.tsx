'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface PushNotificationContextType {
  token: string | null
  permission: NotificationPermission
  loading: boolean
  error: string | null
  requestPermissionAndRegister: () => Promise<string | null>
}

const PushNotificationContext = createContext<PushNotificationContextType | undefined>(undefined)

export function PushNotificationProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestPermissionAndRegister = async () => {
    console.log(`[FCM Client] Initiating push registration check for user: ${userId}`)
    
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      const msg = 'Service Workers are not supported in this browser.'
      console.warn(`[FCM Client] ${msg}`)
      setError(msg)
      return null
    }

    const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone);

    if (!('Notification' in window)) {
      if (isIOS && !isStandalone) {
        const msg = 'On iOS, push notifications require adding the app to your Home Screen. Please tap Share -> "Add to Home Screen" in Safari, then launch the app from your home screen.'
        console.warn(`[FCM Client] iOS Web Push restriction: App is not in standalone mode.`)
        setError(msg)
        return null
      } else {
        const msg = 'Push notifications are not supported in this browser.'
        console.warn(`[FCM Client] Notification API not present in window.`)
        setError(msg)
        return null
      }
    }

    console.log('[FCM Client] Browser supports Notifications & Service Worker.')
    setLoading(true)
    setError(null)

    try {
      // 1. Request Permission
      const currentPermission = Notification.permission
      console.log(`[FCM Client] Current Notification.permission: ${currentPermission}`)
      
      const permissionResult = await Notification.requestPermission()
      console.log(`[FCM Client] New Notification.permission: ${permissionResult}`)
      setPermission(permissionResult)

      if (permissionResult !== 'granted') {
        const msg = 'Notification permission denied by user.'
        console.warn(`[FCM Client] ${msg}`)
        setError(msg)
        setLoading(false)
        return null
      }

      // 2. Fetch Firebase Config dynamically
      console.log('[FCM Client] Fetching FCM config from server...')
      const configRes = await fetch('/api/notifications/config')
      if (!configRes.ok) {
        throw new Error('Failed to fetch FCM configuration from server.')
      }
      const config = await configRes.json()

      if (!config.apiKey || !config.projectId || !config.messagingSenderId || !config.appId) {
        const msg = 'FCM credentials missing. Skipping registration.'
        console.warn(`[FCM Client] ${msg}`)
        setError('FCM credentials are not configured on the server.')
        setLoading(false)
        return null
      }

      // 3. Import Firebase client SDKs dynamically to prevent build-time SSR issues
      console.log('[FCM Client] Importing Firebase libraries dynamically...')
      const { initializeApp, getApps, getApp } = await import('firebase/app')
      const { getMessaging, getToken } = await import('firebase/messaging')

      // Initialize or reuse Firebase App
      const app = getApps().length === 0 ? initializeApp(config) : getApp()
      const messaging = getMessaging(app)

      // 4. Register FCM Service Worker with dynamic config passed as query parameters
      console.log('[FCM Client] Registering Firebase Messaging Service Worker...')
      const queryParams = new URLSearchParams({
        apiKey: config.apiKey || '',
        authDomain: config.authDomain || '',
        projectId: config.projectId || '',
        storageBucket: config.storageBucket || '',
        messagingSenderId: config.messagingSenderId || '',
        appId: config.appId || '',
        vapidKey: config.vapidKey || ''
      }).toString()

      const registration = await navigator.serviceWorker.register(`/sw.js?${queryParams}`, {
        scope: '/'
      })
      console.log(`[FCM Client] Service Worker successfully registered. Scope: ${registration.scope}`)

      // 5. Retrieve FCM token
      const isVapidPlaceholder = !config.vapidKey || 
                                 config.vapidKey.includes('placeholder') || 
                                 config.vapidKey.includes('your-')

      if (isVapidPlaceholder) {
        const msg = 'FCM VAPID key is missing or set to a placeholder.'
        console.warn(`[FCM Client] ${msg}`)
        setError('FCM VAPID key is missing or invalid on the server.')
        setLoading(false)
        return null
      }

      console.log('[FCM Client] Fetching FCM token from messaging provider...')
      const fcmToken = await getToken(messaging, {
        vapidKey: config.vapidKey || undefined,
        serviceWorkerRegistration: registration
      })

      if (fcmToken) {
        console.log(`[FCM Client] Generated FCM token: ${fcmToken}`)
        setToken(fcmToken)

        // 6. Post token to our registration endpoint
        console.log('[FCM Client] Registering device token with backend API...')
        const registerRes = await fetch('/api/notifications/register-device', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fcmToken,
            platform: 'web'
          })
        })

        const responseData = await registerRes.json()
        console.log('[FCM Client] API registration response:', responseData)

        if (!registerRes.ok) {
          throw new Error(responseData.error || 'Failed to register device token with server.')
        }

        console.log('[FCM Client] Successful registration response. Device is registered.')
        setError(null)
        return fcmToken
      } else {
        const msg = 'No FCM token obtained. Check permissions or network.'
        console.warn(`[FCM Client] ${msg}`)
        setError('Could not generate push token. Check browser permissions or network.')
        return null
      }
    } catch (err: any) {
      const errMsg = err.message || 'An unexpected error occurred during FCM setup.'
      console.error('[FCM Client] Error setting up push notifications:', err)
      setError(errMsg)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
      
      if ('Notification' in window) {
        setPermission(Notification.permission)
        if (Notification.permission === 'granted') {
          requestPermissionAndRegister().catch(() => {})
        } else {
          // Register base PWA service worker for offline support
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {})
          }
        }
      } else {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/sw.js').catch(() => {})
        }
        if (isIOS && !isStandalone) {
          setError('On iOS, push notifications require adding the app to your Home Screen. Tap Share -> "Add to Home Screen" in Safari, then open the app from your home screen.')
        }
      }
    }
  }, [userId])

  return (
    <PushNotificationContext.Provider value={{ token, permission, loading, error, requestPermissionAndRegister }}>
      {children}
    </PushNotificationContext.Provider>
  )
}

export function usePushNotifications() {
  const context = useContext(PushNotificationContext)
  if (context === undefined) {
    throw new Error('usePushNotifications must be used within a PushNotificationProvider')
  }
  return context
}
