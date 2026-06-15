import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: settings, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json(settings || {
      chat_enabled: true,
      focus_enabled: true,
      ai_enabled: true,
      memory_enabled: true,
      achievement_enabled: true
    })
  } catch (err: any) {
    console.error('Error fetching notification preferences:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = {
      chat_enabled: body.chat_enabled,
      focus_enabled: body.focus_enabled,
      ai_enabled: body.ai_enabled,
      memory_enabled: body.memory_enabled,
      achievement_enabled: body.achievement_enabled
    }

    // Filter out undefined keys
    Object.keys(updates).forEach(key => {
      const k = key as keyof typeof updates
      if (updates[k] === undefined) delete updates[k]
    })

    const { data, error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: user.id,
        ...updates
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, settings: data })
  } catch (err: any) {
    console.error('Error updating notification preferences:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
