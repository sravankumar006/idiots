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
