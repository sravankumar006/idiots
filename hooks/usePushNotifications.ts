'use client'

import { useEffect, useState } from 'react'

export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [loading, setLoading] = useState(false)

  const requestPermissionAndRegister = async () => {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      console.warn('Push notifications or Service Workers not supported in this browser.')
      return null
    }

    setLoading(true)
    try {
      // 1. Request Permission
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult !== 'granted') {
        console.warn('Notification permission denied by user.')
        setLoading(false)
        return null
      }

      // 2. Fetch Firebase Config dynamically
      const configRes = await fetch('/api/notifications/config')
      if (!configRes.ok) throw new Error('Failed to fetch FCM configuration.')
      const config = await configRes.json()

      if (!config.apiKey || !config.projectId || !config.messagingSenderId || !config.appId) {
        console.warn('FCM credentials missing. Skipping registration.')
        setLoading(false)
        return null
      }

      // 3. Import Firebase client SDKs dynamically to prevent build-time SSR issues
      const { initializeApp, getApps, getApp } = await import('firebase/app')
      const { getMessaging, getToken } = await import('firebase/messaging')

      // Initialize or reuse Firebase App
      const app = getApps().length === 0 ? initializeApp(config) : getApp()
      const messaging = getMessaging(app)

      // 4. Register FCM Service Worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      })

      // 5. Retrieve FCM token
      const fcmToken = await getToken(messaging, {
        vapidKey: config.vapidKey || undefined,
        serviceWorkerRegistration: registration
      })

      if (fcmToken) {
        setToken(fcmToken)

        // 6. Post token to our registration endpoint
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

        if (!registerRes.ok) {
          throw new Error('Failed to register FCM token with server.')
        }

        console.log('FCM Push Notification token registered successfully.')
      } else {
        console.warn('No FCM token obtained. Check permissions or network.')
      }
    } catch (err) {
      console.error('Error setting up push notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
      // Auto-register if permission was already granted previously
      if (Notification.permission === 'granted') {
        requestPermissionAndRegister().catch(() => {})
      }
    }
  }, [])

  return {
    token,
    permission,
    loading,
    requestPermissionAndRegister
  }
}
