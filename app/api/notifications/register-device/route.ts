import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { fcmToken, platform = 'web' } = await req.json()
    if (!fcmToken) {
      return NextResponse.json({ error: 'Missing fcmToken' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clean up if this token was previously registered by another user (prevent cross-user notifications)
    await supabase
      .from('user_devices')
      .delete()
      .eq('fcm_token', fcmToken)
      .neq('user_id', user.id)

    // Upsert the token for the current user
    const { error } = await supabase
      .from('user_devices')
      .upsert({
        user_id: user.id,
        fcm_token: fcmToken,
        platform
      }, {
        onConflict: 'fcm_token'
      })

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Device registered successfully.' })
  } catch (err: any) {
    console.error('Error registering device:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
