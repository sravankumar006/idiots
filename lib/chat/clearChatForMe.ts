import { SupabaseClient } from '@supabase/supabase-js'

export async function clearChatForMe(
  supabase: SupabaseClient,
  activeUserId: string,
  groupId: string,
  clearedAt: string = new Date().toISOString()
): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('group_clears')
      .upsert(
        {
          user_id: activeUserId,
          group_id: groupId,
          cleared_at: clearedAt
        },
        { onConflict: 'user_id,group_id' }
      )
    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('Failed to register clear-chat-for-me action in database:', err)
    return { success: false, error: err }
  }
}
export default clearChatForMe
