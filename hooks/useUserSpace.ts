'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface UserSpaceData {
  user_id: string
  wallpaper_url: string
  theme_color: string
  pinned_quote: string
  song_title: string
  song_url: string
  study_playlist_url: string
  widgets_layout: string[]
  ambient_sound: string
  profile_accents: string
  music_autoplay: boolean
}

export const DEFAULT_USER_SPACE = (userId: string): UserSpaceData => ({
  user_id: userId,
  wallpaper_url: 'starry-night', // Default wallpaper preset
  theme_color: 'violet',
  pinned_quote: 'stay warm, stay coding.',
  song_title: 'Cozy Rain Ambience',
  song_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  study_playlist_url: '',
  widgets_layout: ['mood', 'quote', 'music', 'goals', 'streak', 'contributions'],
  ambient_sound: 'none',
  profile_accents: 'none',
  music_autoplay: false
})

export function useUserSpace(userId: string | null | undefined, activeUserId?: string | null) {
  const [loading, setLoading] = useState(true)
  const [spaceData, setSpaceData] = useState<UserSpaceData | null>(null)

  const supabase = createClient()
  const isReadOnly = activeUserId ? (userId !== activeUserId) : false

  const fetchSpace = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const fallbackKey = `mock_user_space_${userId}`

    try {
      const { data, error } = await supabase
        .from('user_spaces')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error

      if (data) {
        // Enforce types for widgets_layout
        const widgets = Array.isArray(data.widgets_layout) 
          ? data.widgets_layout 
          : DEFAULT_USER_SPACE(userId).widgets_layout

        setSpaceData({
          ...data,
          widgets_layout: widgets
        } as UserSpaceData)
      } else {
        const def = DEFAULT_USER_SPACE(userId)
        // Auto-insert if it's the active user
        if (userId === activeUserId) {
          try {
            await supabase.from('user_spaces').insert(def)
          } catch (insertErr) {
            console.warn("Auto-insert user_space failed:", insertErr)
          }
        }
        setSpaceData(def)
      }
    } catch (err: any) {
      console.warn("DB user_space fetch failed, using localStorage fallback:", err.message)
      
      const localData = localStorage.getItem(fallbackKey)
      if (localData) {
        setSpaceData(JSON.parse(localData))
      } else {
        const def = DEFAULT_USER_SPACE(userId)
        localStorage.setItem(fallbackKey, JSON.stringify(def))
        setSpaceData(def)
      }
    } finally {
      setLoading(false)
    }
  }, [userId, activeUserId, supabase])

  useEffect(() => {
    if (userId) {
      fetchSpace()
    }
  }, [userId, fetchSpace])

  const updateSpaceData = async (updates: Partial<UserSpaceData>) => {
    if (isReadOnly || !userId || !spaceData) return

    const nextData = { ...spaceData, ...updates }
    setSpaceData(nextData)

    try {
      const { error } = await supabase
        .from('user_spaces')
        .update(updates)
        .eq('user_id', userId)
      
      if (error) throw error
    } catch (err: any) {
      console.warn("DB user_space update failed, using localStorage fallback:", err.message)
      localStorage.setItem(`mock_user_space_${userId}`, JSON.stringify(nextData))
    }
  }

  return {
    loading,
    spaceData,
    isReadOnly,
    updateSpaceData,
    refetch: fetchSpace
  }
}
