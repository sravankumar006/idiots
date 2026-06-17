// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

const urlParams = new URLSearchParams(self.location.search)
const apiKey = urlParams.get('apiKey')
const projectId = urlParams.get('projectId')
const authDomain = urlParams.get('authDomain')
const storageBucket = urlParams.get('storageBucket')
const messagingSenderId = urlParams.get('messagingSenderId')
const appId = urlParams.get('appId')

if (apiKey && projectId) {
  try {
    firebase.initializeApp({
      apiKey,
      authDomain: authDomain || undefined,
      projectId,
      storageBucket: storageBucket || undefined,
      messagingSenderId: messagingSenderId || undefined,
      appId: appId || undefined
    })
    const messaging = firebase.messaging()

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload)

      const notificationTitle = payload.notification?.title || 'New Notification'
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/logo.png', // Fallback icon path
        data: payload.data
      }

      self.registration.showNotification(notificationTitle, notificationOptions)
    })
    console.log('[firebase-messaging-sw.js] Firebase Messaging initialized synchronously.')
  } catch (err) {
    console.error('[firebase-messaging-sw.js] Synchronous Firebase initialization failed:', err)
  }
} else {
  console.warn('[firebase-messaging-sw.js] Firebase credentials not found in URL parameters. Initialization skipped.')
}

// Handle notification click event (deep-linking)
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.', event)
  event.notification.close()

  // Extract data from the notification payload
  const data = event.notification.data || {}
  const category = data.category
  const roomId = data.room_id

  // Determine target path based on room_id and category
  let targetPath = '/'
  if (roomId) {
    targetPath = `/us/chat/${roomId}`
  } else if (category === 'chat') {
    targetPath = `/us/chat`
  } else if (category === 'focus') {
    targetPath = `/growth/focus`
  } else if (category === 'ai') {
    targetPath = `/ai`
  } else if (category === 'memory') {
    targetPath = `/us/vault`
  } else if (category === 'achievement') {
    targetPath = `/growth`
  }

  const targetUrl = new URL(targetPath, self.location.origin).toString()

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Look for an existing tab of this origin
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i]
        const clientUrl = new URL(client.url)
        
        // If the tab is on the same site, navigate it to targetUrl and bring to focus
        if (clientUrl.origin === self.location.origin && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl)
          }
          return client.focus()
        }
      }
      // 2. If no tab is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
