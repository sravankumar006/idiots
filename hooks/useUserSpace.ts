'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface UserSpaceData {
  user_id: string
  // new fields
  profile_banner: string
  profile_wallpaper: string
  favorite_quote: string
  pinned_memories: string[]
  coding_goals: string[]
  study_goals: string[]
  current_status: string
  theme_colors: string
  // backward compatibility fields
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
  profile_banner: '',
  profile_wallpaper: 'starry-night',
  favorite_quote: 'stay warm, stay coding.',
  pinned_memories: [],
  coding_goals: ['Solve 200 DSA problems', 'Build 3 Fullstack projects'],
  study_goals: ['Study 2 hours daily', 'Achieve a 5-day focus streak'],
  current_status: 'hacking away on a cozy night...',
  theme_colors: 'violet',
  // compatibility
  wallpaper_url: 'starry-night',
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
      const [spaceRes, layoutRes] = await Promise.all([
        supabase.from('personal_spaces').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('dashboard_layouts').select('*').eq('user_id', userId).maybeSingle()
      ])

      if (spaceRes.error) throw spaceRes.error
      if (layoutRes.error) throw layoutRes.error

      const spaceDataObj = spaceRes.data
      const layoutDataObj = layoutRes.data

      if (spaceDataObj) {
        const widgets = layoutDataObj && Array.isArray(layoutDataObj.widgets_layout) 
          ? layoutDataObj.widgets_layout 
          : DEFAULT_USER_SPACE(userId).widgets_layout

        setSpaceData({
          user_id: userId,
          profile_banner: spaceDataObj.profile_banner || '',
          profile_wallpaper: spaceDataObj.profile_wallpaper || 'starry-night',
          favorite_quote: spaceDataObj.favorite_quote || '',
          pinned_memories: spaceDataObj.pinned_memories || [],
          coding_goals: spaceDataObj.coding_goals || [],
          study_goals: spaceDataObj.study_goals || [],
          current_status: spaceDataObj.current_status || '',
          theme_colors: spaceDataObj.theme_colors || 'violet',
          // compatibility
          wallpaper_url: spaceDataObj.profile_wallpaper || 'starry-night',
          theme_color: spaceDataObj.theme_colors || 'violet',
          pinned_quote: spaceDataObj.favorite_quote || 'stay warm, stay coding.',
          song_title: spaceDataObj.song_title || 'Cozy Rain Ambience',
          song_url: spaceDataObj.song_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          study_playlist_url: spaceDataObj.study_playlist_url || '',
          widgets_layout: widgets,
          ambient_sound: spaceDataObj.ambient_sound || 'none',
          profile_accents: spaceDataObj.profile_accents || 'none',
          music_autoplay: spaceDataObj.music_autoplay || false
        } as UserSpaceData)
      } else {
        const def = DEFAULT_USER_SPACE(userId)
        // Auto-insert if it's the active user
        if (userId === activeUserId) {
          try {
            await Promise.all([
              supabase.from('personal_spaces').insert({
                user_id: userId,
                profile_banner: def.profile_banner,
                profile_wallpaper: def.profile_wallpaper,
                favorite_quote: def.favorite_quote,
                pinned_memories: def.pinned_memories,
                coding_goals: def.coding_goals,
                study_goals: def.study_goals,
                current_status: def.current_status,
                theme_colors: def.theme_colors,
                ambient_sound: def.ambient_sound,
                profile_accents: def.profile_accents,
                music_autoplay: def.music_autoplay,
                song_title: def.song_title,
                song_url: def.song_url,
                study_playlist_url: def.study_playlist_url
              }),
              supabase.from('dashboard_layouts').insert({
                user_id: userId,
                widgets_layout: def.widgets_layout
              })
            ])
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
      const spaceUpdates: any = {}
      if (updates.profile_banner !== undefined) spaceUpdates.profile_banner = updates.profile_banner
      if (updates.profile_wallpaper !== undefined) spaceUpdates.profile_wallpaper = updates.profile_wallpaper
      if (updates.wallpaper_url !== undefined) spaceUpdates.profile_wallpaper = updates.wallpaper_url
      if (updates.favorite_quote !== undefined) spaceUpdates.favorite_quote = updates.favorite_quote
      if (updates.pinned_quote !== undefined) spaceUpdates.favorite_quote = updates.pinned_quote
      if (updates.pinned_memories !== undefined) spaceUpdates.pinned_memories = updates.pinned_memories
      if (updates.coding_goals !== undefined) spaceUpdates.coding_goals = updates.coding_goals
      if (updates.study_goals !== undefined) spaceUpdates.study_goals = updates.study_goals
      if (updates.current_status !== undefined) spaceUpdates.current_status = updates.current_status
      if (updates.theme_colors !== undefined) spaceUpdates.theme_colors = updates.theme_colors
      if (updates.theme_color !== undefined) spaceUpdates.theme_colors = updates.theme_color
      if (updates.ambient_sound !== undefined) spaceUpdates.ambient_sound = updates.ambient_sound
      if (updates.profile_accents !== undefined) spaceUpdates.profile_accents = updates.profile_accents
      if (updates.music_autoplay !== undefined) spaceUpdates.music_autoplay = updates.music_autoplay
      if (updates.song_title !== undefined) spaceUpdates.song_title = updates.song_title
      if (updates.song_url !== undefined) spaceUpdates.song_url = updates.song_url
      if (updates.study_playlist_url !== undefined) spaceUpdates.study_playlist_url = updates.study_playlist_url

      const promises: any[] = []
      if (Object.keys(spaceUpdates).length > 0) {
        promises.push(
          supabase.from('personal_spaces').update(spaceUpdates).eq('user_id', userId)
        )
      }

      if (updates.widgets_layout !== undefined) {
        promises.push(
          supabase.from('dashboard_layouts').update({ widgets_layout: updates.widgets_layout }).eq('user_id', userId)
        )
      }

      const results = await Promise.all(promises)
      for (const r of results) {
        if (r.error) throw r.error
      }
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
