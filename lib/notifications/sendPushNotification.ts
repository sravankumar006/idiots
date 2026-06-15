import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging'
import { createClient } from '@supabase/supabase-js'

if (getApps().length === 0) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      })
      console.log("Firebase Admin SDK initialized successfully.")
    } else {
      console.warn("FCM environment variables missing. Firebase Admin SDK not initialized.")
    }
  } catch (err) {
    console.error("Failed to initialize Firebase Admin SDK:", err)
  }
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  category: string,
  data?: Record<string, string>
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase credentials missing, cannot query devices or preferences.")
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // 1. Fetch user notification preferences
  const { data: settings, error: settingsErr } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (settingsErr) {
    console.error("Error fetching notification settings:", settingsErr)
  }

  // Check category preference
  if (settings) {
    const key = `${category}_enabled` as keyof typeof settings
    if (settings[key] === false) {
      console.log(`User ${userId} has disabled notifications for ${category}. Skipping push.`)
      return
    }
  }

  // 2. Fetch user's registered devices/tokens
  const { data: devices, error: devicesErr } = await supabase
    .from('user_devices')
    .select('fcm_token, platform')
    .eq('user_id', userId)

  if (devicesErr) {
    console.error("Error fetching user devices:", devicesErr)
    return
  }

  if (!devices || devices.length === 0) {
    console.log(`No registered devices found for user ${userId}. Skipping push.`)
    return
  }

  const tokens = devices.map(d => d.fcm_token)

  // 3. Send via FCM if Firebase Admin is initialized
  if (getApps().length > 0) {
    try {
      const payload: MulticastMessage = {
        tokens,
        notification: {
          title,
          body,
        },
        data: {
          category,
          click_action: 'FLUTTER_NOTIFICATION_CLICK', // standard Capacitor/Android compatibility
          ...data
        },
        android: {
          notification: {
            sound: 'default',
            clickAction: 'FCM_PLUGIN_ACTIVITY',
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default'
            }
          }
        }
      }

      const response = await getMessaging().sendEachForMulticast(payload)
      console.log(`Successfully sent FCM push to ${response.successCount} devices. Failures: ${response.failureCount}`)
      
      // Clean up expired tokens
      if (response.failureCount > 0) {
        const tokensToRemove: string[] = []
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            const code = resp.error.code
            if (
              code === 'messaging/invalid-registration-token' ||
              code === 'messaging/registration-token-not-registered'
            ) {
              tokensToRemove.push(tokens[idx])
            }
          }
        })

        if (tokensToRemove.length > 0) {
          await supabase
            .from('user_devices')
            .delete()
            .in('fcm_token', tokensToRemove)
          console.log(`Cleaned up ${tokensToRemove.length} expired FCM tokens from user_devices.`)
        }
      }
    } catch (fcmErr) {
      console.error("Error sending FCM multicast:", fcmErr)
    }
  } else {
    console.warn("FCM push skipped (Firebase Admin SDK not initialized). Logged notification only.")
  }
}
