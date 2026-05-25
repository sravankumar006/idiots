import { SupabaseClient } from '@supabase/supabase-js'
import { ChatMessage, UserProfile } from '@/types'

// Mock messages for fallback
const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  'default-group': [
    {
      id: 'm1',
      group_id: 'default-group',
      sender_id: 'sys',
      message: 'Connection established. Welcome to Idiots Space (IS) group chat.',
      type: 'text',
      reply_to: null,
      created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      profiles: {
        id: 'sys',
        username: 'System Companion',
        email: 'sys@idiots.space',
        avatar: 'avatar-cyber-ghost',
        created_at: new Date().toISOString()
      },
      reactions: []
    },
    {
      id: 'm2',
      group_id: 'default-group',
      sender_id: 'np',
      message: 'Check out the new features! We have collapsible sidebars, a modular layout, Pomodoro timers, and emoji reactions.',
      type: 'text',
      reply_to: null,
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      profiles: {
        id: 'np',
        username: 'Neon Pulse',
        email: 'neon@idiots.space',
        avatar: 'avatar-neon-pulse',
        created_at: new Date().toISOString()
      },
      reactions: [
        { id: 'r1', message_id: 'm2', user_id: 'sys', emoji: '✨', created_at: new Date().toISOString() }
      ]
    }
  ]
}

interface FetchMessagesResult {
  messages: ChatMessage[]
  isFallback: boolean
}

export async function fetchMessages(
  supabase: SupabaseClient,
  groupId: string,
  activeUser: UserProfile | null
): Promise<FetchMessagesResult> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  // 1. Fallback / Mock Group Check
  if (!uuidRegex.test(groupId)) {
    const localMsgsKey = `fallback_messages_${groupId}`
    let localMsgs: ChatMessage[] = []
    try {
      const raw = localStorage.getItem(localMsgsKey)
      if (raw) {
        localMsgs = JSON.parse(raw)
      } else {
        localMsgs = MOCK_MESSAGES[groupId] || MOCK_MESSAGES['default-group']
        localStorage.setItem(localMsgsKey, JSON.stringify(localMsgs))
      }
    } catch {
      localMsgs = MOCK_MESSAGES[groupId] || MOCK_MESSAGES['default-group']
    }

    let clearedAt: string | null = null
    let deletedMsgIds: string[] = []
    try {
      clearedAt = localStorage.getItem(`clear_time_${groupId}`)
      deletedMsgIds = JSON.parse(localStorage.getItem(`deleted_msgs_${groupId}`) || '[]')
    } catch {}

    let filtered = localMsgs
    if (clearedAt) {
      filtered = filtered.filter(m => m.created_at > (clearedAt as string))
    }
    filtered = filtered.filter(m => !deletedMsgIds.includes(m.id))

    return { messages: filtered, isFallback: true }
  }

  try {
    // 2. Fetch cleared_at timestamp for this user & group
    let clearedAt: string | null = null
    if (activeUser) {
      const { data: clearData } = await supabase
        .from('group_clears')
        .select('cleared_at')
        .eq('group_id', groupId)
        .eq('user_id', activeUser.id)
        .maybeSingle()
      
      if (clearData) {
        clearedAt = clearData.cleared_at
      }
    }

    // 3. Fetch deleted message ids for this user
    let deletedMsgIds: string[] = []
    if (activeUser) {
      const { data: deletedData } = await supabase
        .from('deleted_messages')
        .select('message_id')
        .eq('user_id', activeUser.id)
      
      if (deletedData) {
        deletedMsgIds = deletedData.map((d: any) => d.message_id)
      }
    }

    // 4. Fetch main messages
    let query = supabase
      .from('messages')
      .select('*, profiles(*), reactions(*, profiles(*)), message_seen(*, profiles(*))')
      .eq('group_id', groupId)
    
    if (clearedAt) {
      query = query.gt('created_at', clearedAt)
    }

    const { data, error } = await query.order('created_at', { ascending: true })

    if (error) throw error

    const dbMessages = (data || []) as ChatMessage[]
    
    // Filter out deleted messages
    const filteredMessages = dbMessages.filter(msg => !deletedMsgIds.includes(msg.id))

    // Enrich replied_message pointers for existing history
    const enrichedMessages = filteredMessages.map(msg => {
      if (msg.reply_to) {
        const parent = filteredMessages.find(m => m.id === msg.reply_to)
        if (parent) {
          return {
            ...msg,
            replied_message: {
              id: parent.id,
              message: parent.message,
              sender_name: parent.profiles?.username || 'Explorer'
            }
          }
        }
      }
      return msg
    })

    return { messages: enrichedMessages, isFallback: false }
  } catch (err) {
    console.warn("Supabase messages fetch failed. Falling back to mock local storage.", err)
    
    // Attempt local storage fallback
    const localMsgsKey = `fallback_messages_${groupId}`
    let localMsgs: ChatMessage[] = []
    try {
      const raw = localStorage.getItem(localMsgsKey)
      localMsgs = raw ? JSON.parse(raw) : (MOCK_MESSAGES[groupId] || MOCK_MESSAGES['default-group'])
    } catch {
      localMsgs = MOCK_MESSAGES[groupId] || MOCK_MESSAGES['default-group']
    }

    return { messages: localMsgs, isFallback: true }
  }
}
