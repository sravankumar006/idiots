import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  console.log('[FCM Server] Received device registration request.')
  
  try {
    const { fcmToken, platform = 'web' } = await req.json()
    console.log(`[FCM Server] Request params: fcmToken = ${fcmToken ? `${fcmToken.slice(0, 10)}...` : 'missing'}, platform = ${platform}`)
    
    if (!fcmToken) {
      console.warn('[FCM Server] Registration failed: Missing fcmToken.')
      return NextResponse.json({ error: 'Missing fcmToken' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.warn('[FCM Server] Registration failed: Unauthorized (no session user).')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[FCM Server] Authenticated user id: ${user.id}`)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[FCM Server] Supabase admin credentials are not set. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey)

    // Clean up if this token was previously registered by another user (prevent cross-user notifications)
    console.log('[FCM Server] Cleaning up any old registrations of this token for other users...')
    const { error: deleteError } = await adminClient
      .from('user_devices')
      .delete()
      .eq('fcm_token', fcmToken)
      .neq('user_id', user.id)

    if (deleteError) {
      console.error('[FCM Server] Warning during old token cleanup:', deleteError)
    } else {
      console.log('[FCM Server] Cleaned up conflicting token records (if any).')
    }

    // Upsert the token for the current user
    console.log('[FCM Server] Upserting device registration into user_devices...')
    const { error } = await adminClient
      .from('user_devices')
      .upsert({
        user_id: user.id,
        fcm_token: fcmToken,
        platform
      }, {
        onConflict: 'fcm_token'
      })

    if (error) {
      console.error('[FCM Server] Supabase upsert error:', error)
      throw error
    }

    console.log('[FCM Server] Device registration successfully saved to public.user_devices.')
    return NextResponse.json({ success: true, message: 'Device registered successfully.' })
  } catch (err: any) {
    console.error('[FCM Server] Registration API failed with error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
