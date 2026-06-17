'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChatMessage, UserProfile } from '@/types'
import { createClient } from '@/lib/supabase/client'

export interface QueuedMessage {
  tempId: string
  groupId: string
  activeUser: UserProfile
  text: string
  category?: string
  replyToId: string | null
  createdAt: string
}

export function useOfflineQueue(
  onMessageSynced?: (tempId: string, syncedMsg: ChatMessage) => void,
  onMessageFailed?: (tempId: string) => void
) {
  const [queue, setQueue] = useState<QueuedMessage[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const supabase = createClient()
  const syncRef = useRef(false)

  // Load queue on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('offline_message_queue')
      if (stored) {
        setQueue(JSON.parse(stored))
      }
    } catch (err) {
      console.warn('Failed to load offline queue:', err)
    }
  }, [])

  const saveQueue = useCallback((newQueue: QueuedMessage[]) => {
    setQueue(newQueue)
    try {
      localStorage.setItem('offline_message_queue', JSON.stringify(newQueue))
    } catch (err) {
      console.warn('Failed to save offline queue:', err)
    }
  }, [])

  const enqueue = useCallback((msg: QueuedMessage) => {
    // Add to existing queue
    const updated = [...queue, msg]
    saveQueue(updated)
  }, [queue, saveQueue])

  const syncQueue = useCallback(async () => {
    if (queue.length === 0 || syncRef.current) return
    
    syncRef.current = true
    setIsSyncing(true)

    const currentQueue = [...queue]
    const remainingQueue = [...queue]

    for (const item of currentQueue) {
      if (!navigator.onLine) {
        break // Stop if connection went down again
      }

      try {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            group_id: item.groupId,
            sender_id: item.activeUser.id,
            message: item.text,
            type: 'text',
            category: item.category,
            reply_to: item.replyToId,
            created_at: item.createdAt
          })
          .select('*, profiles(*)')
          .single()

        if (error) throw error

        if (data) {
          // Remove from remaining queue
          const index = remainingQueue.findIndex(q => q.tempId === item.tempId)
          if (index !== -1) {
            remainingQueue.splice(index, 1)
          }
          // Notify caller
          if (onMessageSynced) {
            onMessageSynced(item.tempId, {
              ...data,
              sending: false
            } as ChatMessage)
          }
        }
      } catch (err) {
        console.error('Failed to sync offline message:', err)
        if (onMessageFailed) {
          onMessageFailed(item.tempId)
        }
        // Stop syncing rest of queue if network issue
        break
      }
    }

    saveQueue(remainingQueue)
    setIsSyncing(false)
    syncRef.current = false
  }, [queue, supabase, saveQueue, onMessageSynced, onMessageFailed])

  // Monitor connectivity changes to sync the queue
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      syncQueue()
    }

    window.addEventListener('online', handleOnline)
    
    // Attempt sync on mount if online
    if (navigator.onLine && queue.length > 0) {
      syncQueue()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [syncQueue, queue.length])

  return {
    queue,
    enqueue,
    syncQueue,
    isSyncing
  }
}
