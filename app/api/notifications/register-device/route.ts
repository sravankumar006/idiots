import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Supabase admin credentials are not set.");
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey)

    // Clean up if this token was previously registered by another user (prevent cross-user notifications)
    await adminClient
      .from('user_devices')
      .delete()
      .eq('fcm_token', fcmToken)
      .neq('user_id', user.id)

    // Upsert the token for the current user
    const { error } = await adminClient
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
