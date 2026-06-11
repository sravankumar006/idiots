import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { target, content, title, sourceId, metadata } = body

    if (!content) {
      return NextResponse.json({ message: 'Content is required' }, { status: 400 })
    }

    // target can be 'vault', 'note', 'saved_response', or 'memory'
    if (target === 'memory') {
      // Save to ai_memories
      const { error } = await supabase
        .from('ai_memories')
        .insert({
          created_by: user.id,
          content: content,
          title: title || 'Saved Memory',
          memory_type: 'Saved'
        })
      if (error) throw error
    } else if (['vault', 'note', 'saved_response'].includes(target)) {
      // Save to user_saved_items
      const { error } = await supabase
        .from('user_saved_items')
        .insert({
          user_id: user.id,
          item_type: target,
          title: title || 'Untitled',
          content: content,
          source_id: sourceId || null
        })
      if (error) throw error
    } else {
      return NextResponse.json({ message: 'Invalid target' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: `Successfully saved to ${target}` })
  } catch (error: any) {
    console.error('Failed to save item:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
