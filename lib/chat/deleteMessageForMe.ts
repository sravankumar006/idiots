import { SupabaseClient } from '@supabase/supabase-js'

export async function deleteMessageForMe(
  supabase: SupabaseClient,
  activeUserId: string,
  messageId: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('deleted_messages')
      .insert({
        user_id: activeUserId,
        message_id: messageId
      })
    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('Failed to register delete-for-me action in database:', err)
    return { success: false, error: err }
  }
}
export default deleteMessageForMe
