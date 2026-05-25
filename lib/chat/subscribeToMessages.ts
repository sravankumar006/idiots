import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'
import { ChatMessage, ChatReaction } from '@/types'

interface SubscriptionCallbacks {
  onInsertMessage: (message: ChatMessage) => void
  onUpdateMessage: (message: ChatMessage) => void
  onReactionChange: (event: 'INSERT' | 'DELETE', reaction: ChatReaction) => void
  onAIStream?: (messageId: string, text: string) => void
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
    
    // Listen to AI streams
    .on(
      'broadcast',
      { event: 'ai_stream_update' },
      (payload) => {
        if (callbacks.onAIStream) {
          callbacks.onAIStream(payload.payload.messageId, payload.payload.text)
        }
      }
    )
    .subscribe()

  return channel
}
export default subscribeToMessages
