'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface MoodLog {
  id: string
  user_id: string
  mood_rating: number
  mood_value: number
  mood_label: string
  energy_level: number
  focus_level: number
  status_text: string
  visibility: string
  created_at: string
}

export interface MemoryVaultItem {
  id: string
  user_id: string
  title: string
  message_id: string | null
  file_url: string
  file_name: string
  notes: string
  is_shared: boolean
  category: string
  tags: string[]
  created_at: string
}

export interface AIMemoryItem {
  id: string
  created_by: string
  title: string
  content: string
  memory_type: string
  is_visible: boolean
  created_at: string
}

export function useMoodAndMemories(userId: string | null | undefined) {
  const [loading, setLoading] = useState(true)
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([])
  const [vaultItems, setVaultItems] = useState<MemoryVaultItem[]>([])
  const [aiMemories, setAIMemories] = useState<AIMemoryItem[]>([])

  const supabase = createClient()

  // 1. Fetch All Emotional / Memory Data
  const fetchData = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const moodKey = `mock_mood_logs_${userId}`
    const vaultKey = `mock_memory_vault_${userId}`
    const aiMemKey = `mock_ai_memories_${userId}`

    try {
      let [moodRes, vaultRes, aiRes] = await Promise.all([
        supabase.from('mood_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30),
        supabase.from('vault_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('ai_memories').select('*').eq('created_by', userId).order('created_at', { ascending: false })
      ])

      // Fallback for vault_entries -> memory_vault if missing
      if (vaultRes.error && (vaultRes.error.code === 'PGRST205' || vaultRes.error.message.includes('does not exist') || vaultRes.error.code === '42P01')) {
        vaultRes = await supabase.from('memory_vault').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      }

      if (moodRes.error) console.warn("Mood fetch error:", moodRes.error);
      if (vaultRes.error) console.warn("Vault fetch error:", vaultRes.error);
      if (aiRes.error) console.warn("AI Memories fetch error:", aiRes.error);

      setMoodLogs((moodRes.data as MoodLog[]) || []);
      setVaultItems((vaultRes.data as MemoryVaultItem[]) || []);
      setAIMemories((aiRes.data as AIMemoryItem[]) || []);
    } catch (err: any) {
      console.warn("DB fetch failed in useMoodAndMemories (switching to localStorage fallback):", err.message)
      
      // Load from LocalStorage
      const localMood = localStorage.getItem(moodKey)
      setMoodLogs(localMood ? JSON.parse(localMood) : [])

      const localVault = localStorage.getItem(vaultKey)
      setVaultItems(localVault ? JSON.parse(localVault) : [])

      const localAIMem = localStorage.getItem(aiMemKey)
      setAIMemories(localAIMem ? JSON.parse(localAIMem) : [])
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    if (userId) {
      fetchData()
    }
  }, [userId, fetchData])

  // 2. Log a Mood
  const logMood = async (rating: number, energy: number, focus: number, text: string, visibility = 'public') => {
    if (!userId) return

    const moodValue = rating * 10
    const moodLabels = ['😔 Low', '😔 Low', '😔 Low', '😕 Tired', '😕 Tired', '😐 Okay', '😐 Okay', '🙂 Good', '🙂 Good', '😀 Great', '😀 Great']
    const moodLabel = moodLabels[Math.min(10, Math.max(1, rating))]

    const newLog: MoodLog = {
      id: `mood-${Date.now()}`,
      user_id: userId,
      mood_rating: rating,
      mood_value: moodValue,
      mood_label: moodLabel,
      energy_level: energy,
      focus_level: focus,
      status_text: text,
      visibility,
      created_at: new Date().toISOString()
    }

    setMoodLogs((prev) => [newLog, ...prev])

    try {
      const { error } = await supabase.from('mood_logs').insert({
        user_id: userId,
        mood_rating: rating,
        mood_value: moodValue,
        mood_label: moodLabel,
        energy_level: energy,
        focus_level: focus,
        status_text: text,
        visibility
      })
      if (error) {
        if (error.message.includes('does not exist') || error.code === 'PGRST204' || error.code === '42703') {
          console.warn("New mood_logs columns missing, falling back to old schema.");
          const { error: fallbackError } = await supabase.from('mood_logs').insert({
            user_id: userId,
            mood_rating: rating,
            energy_level: energy,
            focus_level: focus,
            status_text: text
          })
          if (fallbackError) throw fallbackError;
        } else {
          throw error;
        }
      }
    } catch (err: any) {
      console.warn("DB mood insertion failed, using localStorage fallback:", err.message)
      const moodKey = `mock_mood_logs_${userId}`
      const current = JSON.parse(localStorage.getItem(moodKey) || '[]')
      localStorage.setItem(moodKey, JSON.stringify([newLog, ...current]))
    }
  }

  // 3. Save to Vault
  const saveToVault = async (
    title: string,
    messageId: string | null,
    fileUrl: string,
    fileName: string,
    notes: string,
    isShared = true,
    category = 'chats',
    tags: string[] = []
  ) => {
    if (!userId) return

    const newItem: MemoryVaultItem = {
      id: `vault-${Date.now()}`,
      user_id: userId,
      title,
      message_id: messageId,
      file_url: fileUrl,
      file_name: fileName,
      notes,
      is_shared: isShared,
      category,
      tags,
      created_at: new Date().toISOString()
    }

    setVaultItems((prev) => [newItem, ...prev])

    try {
      const { error } = await supabase.from('vault_entries').insert({
        user_id: userId,
        title,
        message_id: messageId,
        file_url: fileUrl,
        file_name: fileName,
        notes,
        is_shared: isShared,
        category,
        tags
      })
      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('does not exist') || error.code === '42P01') {
          console.warn("vault_entries missing, falling back to memory_vault schema.");
          const { error: fallbackError } = await supabase.from('memory_vault').insert({
            user_id: userId,
            title,
            message_id: messageId,
            file_url: fileUrl,
            file_name: fileName,
            notes,
            is_shared: isShared
          })
          if (fallbackError) throw fallbackError;
        } else {
          throw error;
        }
      }
    } catch (err: any) {
      console.warn("DB vault insertion failed, using localStorage fallback:", err.message)
      const vaultKey = `mock_memory_vault_${userId}`
      const current = JSON.parse(localStorage.getItem(vaultKey) || '[]')
      localStorage.setItem(vaultKey, JSON.stringify([newItem, ...current]))
    }
  }

  // 4. Delete from Vault
  const deleteFromVault = async (id: string) => {
    if (!userId) return

    setVaultItems((prev) => prev.filter(item => item.id !== id))

    try {
      const { error } = await supabase.from('vault_entries').delete().eq('id', id)
      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('does not exist') || error.code === '42P01') {
          const { error: fallbackError } = await supabase.from('memory_vault').delete().eq('id', id);
          if (fallbackError) throw fallbackError;
        } else {
          throw error;
        }
      }
    } catch (err: any) {
      console.warn("DB vault deletion failed, using localStorage fallback:", err.message)
      const vaultKey = `mock_memory_vault_${userId}`
      const current = JSON.parse(localStorage.getItem(vaultKey) || '[]') as MemoryVaultItem[]
      localStorage.setItem(vaultKey, JSON.stringify(current.filter(item => item.id !== id)))
    }
  }

  // 5. Delete AI Memory
  const deleteAIMemory = async (id: string) => {
    if (!userId) return

    setAIMemories((prev) => prev.filter(item => item.id !== id))

    try {
      const { error } = await supabase.from('ai_memories').delete().eq('id', id)
      if (error) throw error
    } catch (err: any) {
      console.warn("DB AI memory deletion failed, using localStorage fallback:", err.message)
      const aiMemKey = `mock_ai_memories_${userId}`
      const current = JSON.parse(localStorage.getItem(aiMemKey) || '[]') as AIMemoryItem[]
      localStorage.setItem(aiMemKey, JSON.stringify(current.filter(item => item.id !== id)))
    }
  }

  // 6. Toggle AI Memory Visibility
  const toggleAIMemoryVisibility = async (id: string, isVisible: boolean) => {
    if (!userId) return

    setAIMemories((prev) => prev.map(item => item.id === id ? { ...item, is_visible: isVisible } : item))

    try {
      const { error } = await supabase.from('ai_memories').update({ is_visible: isVisible }).eq('id', id)
      if (error) throw error
    } catch (err: any) {
      console.warn("DB AI memory update failed, using localStorage fallback:", err.message)
      const aiMemKey = `mock_ai_memories_${userId}`
      const current = JSON.parse(localStorage.getItem(aiMemKey) || '[]') as AIMemoryItem[]
      const updated = current.map(item => item.id === id ? { ...item, is_visible: isVisible } : item)
      localStorage.setItem(aiMemKey, JSON.stringify(updated))
    }
  }

  // Helper to compute if mood is low
  const isMoodAverageLow = useCallback(() => {
    if (moodLogs.length === 0) return false
    // take average of last 3 logs
    const slice = moodLogs.slice(0, 3)
    const sum = slice.reduce((acc, log) => acc + (log.mood_value / 10), 0)
    const avg = sum / slice.length
    return avg <= 4
  }, [moodLogs])

  return {
    loading,
    moodLogs,
    vaultItems,
    aiMemories,
    logMood,
    saveToVault,
    deleteFromVault,
    deleteAIMemory,
    toggleAIMemoryVisibility,
    isMoodAverageLow,
    refetch: fetchData
  }
}
