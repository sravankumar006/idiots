// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

// Fetch config dynamically from local route
fetch('/api/notifications/config')
  .then(res => res.json())
  .then(config => {
    if (config.apiKey && config.projectId) {
      firebase.initializeApp(config)
      const messaging = firebase.messaging()

      messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Received background message ', payload)

        const notificationTitle = payload.notification.title
        const notificationOptions = {
          body: payload.notification.body,
          icon: '/logo.png', // Fallback icon path
          data: payload.data
        }

        self.registration.showNotification(notificationTitle, notificationOptions)
      })
    }
  })
  .catch(err => {
    console.warn('[firebase-messaging-sw.js] Dynamic Firebase config fetch or initialization skipped.', err)
  })
