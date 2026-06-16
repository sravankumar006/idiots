'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface NotificationItem {
  id: string
  user_id: string
  title: string
  body: string
  category: 'chat' | 'focus' | 'ai' | 'memory' | 'achievement'
  type: string
  related_id: string | null
  entity_type: string | null
  entity_id: string | null
  room_id: string | null
  message_id: string | null
  is_read: boolean
  created_at: string
}

export function useNotifications(userId: string | null | undefined) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // 1. Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setNotifications(data || [])
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  // 2. Mark a single notification as read
  const markAsRead = async (id: string) => {
    try {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      )
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  // 3. Mark all notifications as read
  const markAllAsRead = async () => {
    if (!userId) return
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
      if (error) throw error
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  // 4. Delete a notification
  const deleteNotification = async (id: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id))
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  // 5. Setup Realtime subscription
  useEffect(() => {
    if (!userId) return

    fetchNotifications()

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as NotificationItem
            setNotifications(prev => [newNotif, ...prev])

            // Trigger OS/browser notification in the foreground if permission is granted
            if (
              typeof window !== 'undefined' &&
              'Notification' in window &&
              Notification.permission === 'granted'
            ) {
              try {
                new Notification(newNotif.title, {
                  body: newNotif.body,
                  icon: '/logo.png',
                  tag: newNotif.id
                })
              } catch (err) {
                console.error('Failed to trigger native Notification in foreground:', err)
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotif = payload.new as NotificationItem
            setNotifications(prev =>
              prev.map(n => (n.id === updatedNotif.id ? updatedNotif : n))
            )
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id
            setNotifications(prev => prev.filter(n => n.id !== deletedId))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchNotifications, supabase])

  const unreadCount = notifications.filter(n => !n.is_read).length

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications
  }
}
