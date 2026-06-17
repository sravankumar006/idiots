import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications/createNotification'

export async function POST(req: Request) {
  try {
    const { userId, title, body, category, type, relatedId, entityType, entityId, roomId, messageId } = await req.json()
    if (!userId || !title || !body || !category || !type) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // [TEMP LOG]
    console.log('[TEMP LOG] Incoming notification trigger request:', {
      senderUserId: user.id,
      recipientUserId: userId,
      payload: { title, body, category, type, relatedId, roomId, messageId }
    })

    // Call server-side wrapper to create the notification and trigger FCM push
    const notification = await createNotification({
      userId,
      title,
      body,
      category,
      type,
      relatedId,
      entityType,
      entityId,
      roomId,
      messageId
    })

    if (notification) {
      console.log('[TEMP LOG] Notification created successfully. Recipient:', notification.user_id, 'Notification ID:', notification.id)
    } else {
      console.log('[TEMP LOG] Notification was NOT created (skipped or error). Target Recipient:', userId)
    }

    return NextResponse.json({ success: true, notification })
  } catch (err: any) {
    console.error('Error in trigger notification API:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
