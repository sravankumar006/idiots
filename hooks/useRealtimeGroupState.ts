'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface GroupState {
  studyModeActive: boolean
  timerEndsAt: string | null
  timerDuration: number
  timerType: 'idle' | 'focus' | 'break'
}

export function useRealtimeGroupState(groupId: string) {
  const [state, setState] = useState<GroupState>({
    studyModeActive: false,
    timerEndsAt: null,
    timerDuration: 0,
    timerType: 'idle',
  })
  
  const supabase = createClient()
  const channelRef = useRef<any>(null)

  // Fetch initial group state from DB (handling potential missing columns gracefully)
  const fetchGroupState = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('study_mode_active, study_timer_ends_at, study_timer_duration, study_timer_type')
        .eq('id', groupId)
        .maybeSingle()

      if (error) {
        // If columns are missing or database fails, log it and ignore (fallback will handle)
        console.warn("DB group state fetch warning (migration may not be applied yet):", error.message)
        return
      }

      if (data) {
        setState({
          studyModeActive: !!data.study_mode_active,
          timerEndsAt: data.study_timer_ends_at || null,
          timerDuration: data.study_timer_duration || 0,
          timerType: (data.study_timer_type as GroupState['timerType']) || 'idle',
        })
      }
    } catch (e) {
      console.warn("Error fetching group state:", e)
    }
  }, [groupId, supabase])

  // Synchronous database updates with local & broadcast fallbacks
  const updateGroupDB = async (updates: Partial<any>) => {
    // 1. Instantly update local state for the caller
    setState((prev) => {
      const next = { ...prev }
      if (updates.study_mode_active !== undefined) next.studyModeActive = updates.study_mode_active
      if (updates.study_timer_ends_at !== undefined) next.timerEndsAt = updates.study_timer_ends_at
      if (updates.study_timer_duration !== undefined) next.timerDuration = updates.study_timer_duration
      if (updates.study_timer_type !== undefined) next.timerType = updates.study_timer_type
      return next
    })

    // 2. Try writing to Supabase
    try {
      const { error } = await supabase
        .from('groups')
        .update(updates)
        .eq('id', groupId)

      if (error) {
        // If DB fails (e.g. DDL missing), fallback to broadcasting via the Realtime channel
        throw error
      }
    } catch (err: any) {
      console.warn("DB update failed (falling back to broadcast sync):", err.message)
      // Broadcast fallback
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'group_state_update',
          payload: updates,
        })
      }
    }
  }

  const toggleStudyMode = useCallback(async (active: boolean) => {
    await updateGroupDB({ study_mode_active: active })
  }, [groupId])

  const startTimer = useCallback(async (durationSeconds: number, type: 'focus' | 'break') => {
    const endsAt = new Date(Date.now() + durationSeconds * 1000).toISOString()
    await updateGroupDB({
      study_timer_ends_at: endsAt,
      study_timer_duration: durationSeconds,
      study_timer_type: type
    })
  }, [groupId])

  const stopTimer = useCallback(async () => {
    await updateGroupDB({
      study_timer_ends_at: null,
      study_timer_duration: 0,
      study_timer_type: 'idle'
    })
  }, [groupId])

  // Set up realtime channel subscriptions (Realtime DB updates + Broadcast Fallback)
  useEffect(() => {
    let active = true
    fetchGroupState()

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(groupId)) {
      // Fallback/Mock group
      return
    }

    // Connect to the group activity channel for broadcast updates & database replica events
    const channel = supabase.channel(`group-state-sync:${groupId}`)
      
      // A. Listen to standard replication updates (Postgres changes)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'groups',
          filter: `id=eq.${groupId}`
        },
        (payload: any) => {
          if (!active) return
          const updated = payload.new
          setState({
            studyModeActive: updated.study_mode_active !== undefined ? !!updated.study_mode_active : false,
            timerEndsAt: updated.study_timer_ends_at || null,
            timerDuration: updated.study_timer_duration || 0,
            timerType: updated.study_timer_type || 'idle',
          })
        }
      )
      
      // B. Listen to Realtime Broadcast events (Fallback when DDL is missing)
      .on(
        'broadcast',
        { event: 'group_state_update' },
        (payload: any) => {
          if (!active) return
          const updates = payload.payload
          setState((prev) => {
            const next = { ...prev }
            if (updates.study_mode_active !== undefined) next.studyModeActive = updates.study_mode_active
            if (updates.study_timer_ends_at !== undefined) next.timerEndsAt = updates.study_timer_ends_at
            if (updates.study_timer_duration !== undefined) next.timerDuration = updates.study_timer_duration
            if (updates.study_timer_type !== undefined) next.timerType = updates.study_timer_type
            return next
          })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [groupId, fetchGroupState, supabase])

  return {
    studyModeActive: state.studyModeActive,
    timerEndsAt: state.timerEndsAt,
    timerDuration: state.timerDuration,
    timerType: state.timerType,
    toggleStudyMode,
    startTimer,
    stopTimer
  }
}
export default useRealtimeGroupState
