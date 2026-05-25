import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'
import { ChatMessage, ChatReaction } from '@/types'

interface SubscriptionCallbacks {
  onInsertMessage: (message: ChatMessage) => void
  onUpdateMessage: (message: ChatMessage) => void
  onReactionChange: (event: 'INSERT' | 'DELETE', reaction: ChatReaction) => void
}

export function subscribeToMessages(
  supabase: SupabaseClient,
  groupId: string,
  callbacks: SubscriptionCallbacks
): RealtimeChannel {
  const channel = supabase.channel(`realtime-chat:${groupId}`)
    
    // Listen to new messages
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        callbacks.onInsertMessage(payload.new as ChatMessage)
      }
    )

    // Listen to message updates (soft deletions, edits, etc.)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        callbacks.onUpdateMessage(payload.new as ChatMessage)
      }
    )

    // Listen to reactions
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reactions',
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          callbacks.onReactionChange('INSERT', payload.new as ChatReaction)
        } else if (payload.eventType === 'DELETE') {
          callbacks.onReactionChange('DELETE', payload.old as ChatReaction)
        }
      }
    )
    .subscribe()

  return channel
}
export default subscribeToMessages
