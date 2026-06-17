import { createClient } from '@supabase/supabase-js'
import { sendPushNotification } from './sendPushNotification'

export async function createNotification(params: {
  userId: string
  title: string
  body: string
  category: 'chat' | 'focus' | 'ai' | 'memory' | 'achievement'
  type: string
  relatedId?: string
  entityType?: string
  entityId?: string
  roomId?: string
  messageId?: string
}) {
  const { userId, title, body, category, type, relatedId, entityType, entityId, roomId, messageId } = params

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase credentials missing, cannot insert notifications.")
    return null
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // 1. Check user notification preferences first
  const { data: settings, error: settingsErr } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (settingsErr) {
    console.error("Error fetching notification settings:", settingsErr)
  }

  if (settings) {
    const key = `${category}_enabled` as keyof typeof settings
    if (settings[key] === false) {
      console.log(`[TEMP LOG] User ${userId} has disabled notifications for category '${category}'. Skipping database insert and push delivery.`)
      return null
    }
  }

  // 2. Check for deduplication / grouping within the last 5 minutes
  let existingNotification = null
  const shouldDeduplicate = type === 'reaction' || type === 'mention' || category === 'achievement'

  if (shouldDeduplicate) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', fiveMinutesAgo)

    if (type === 'reaction') {
      const msgId = relatedId || messageId || entityId
      if (msgId) {
        query = query
          .eq('type', 'reaction')
          .or(`related_id.eq.${msgId},message_id.eq.${msgId}`)
      } else {
        query = query.eq('type', 'reaction')
      }
    } else if (type === 'mention') {
      if (roomId) {
        query = query
          .eq('type', 'mention')
          .eq('room_id', roomId)
      } else {
        query = query.eq('type', 'mention')
      }
    } else if (category === 'achievement') {
      query = query.eq('category', 'achievement')
    }

    const { data: matches, error: findError } = await query
      .order('created_at', { ascending: false })
      .limit(1)

    if (findError) {
      console.error("Error searching for deduplication matches:", findError)
    } else if (matches && matches.length > 0) {
      existingNotification = matches[0]
    }
  }

  let notification = null

  if (existingNotification) {
    let mergedTitle = title
    let mergedBody = body

    if (type === 'reaction') {
      mergedTitle = mergeReactionTitles(existingNotification.title, title)
      mergedBody = mergeReactionBodies(existingNotification.body, body)
    } else if (type === 'mention') {
      mergedTitle = mergeMentionTitles(existingNotification.title, title)
      mergedBody = mergeMentionBodies(existingNotification.body, body)
    } else if (category === 'achievement') {
      mergedTitle = mergeAchievementTitles(existingNotification.title, title)
      mergedBody = mergeAchievementBodies(existingNotification.body, body)
    }

    const { data: updated, error: updateError } = await supabase
      .from('notifications')
      .update({
        title: mergedTitle,
        body: mergedBody,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .eq('id', existingNotification.id)
      .select()
      .single()

    if (updateError) {
      console.error("[TEMP LOG] Error updating existing notification for deduplication:", updateError)
    } else {
      notification = updated
      console.log(`[TEMP LOG] Notification ${notification.id} deduplicated and updated successfully for Recipient: ${userId}`)
    }
  }

  // 3. If no existing notification was updated, insert a new one
  if (!notification) {
    const { data: inserted, error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        body,
        category,
        type,
        related_id: relatedId || null,
        entity_type: entityType || null,
        entity_id: entityId || null,
        room_id: roomId || null,
        message_id: messageId || null,
        is_read: false
      })
      .select()
      .single()

    if (insertError) {
      console.error("[TEMP LOG] Error inserting notification record:", insertError)
      return null
    }
    notification = inserted
    console.log('[TEMP LOG] Inserted new notification record in DB. ID:', notification.id, 'Recipient:', notification.user_id)
  }

  // 4. Trigger FCM push notification asynchronously using merged title/body
  sendPushNotification(userId, notification.title, notification.body, category, {
    id: notification.id,
    type,
    related_id: relatedId || '',
    entity_type: entityType || '',
    entity_id: entityId || '',
    room_id: roomId || '',
    message_id: messageId || ''
  }).catch(err => {
    console.error("Asynchronous push delivery failed:", err)
  })

  return notification
}

// --- DEDUPLICATION MERGER HELPERS ---

function mergeReactionTitles(oldTitle: string, newTitle: string): string {
  const oldUsernames = oldTitle.match(/@([a-zA-Z0-9_-]+)/g) || []
  const newUsernames = newTitle.match(/@([a-zA-Z0-9_-]+)/g) || []
  
  const uniqueUsernames = Array.from(new Set([...oldUsernames, ...newUsernames]))
  if (uniqueUsernames.length === 0) {
    return "reactions to your message"
  } else if (uniqueUsernames.length === 1) {
    return `${uniqueUsernames[0]} reacted to your message`
  } else if (uniqueUsernames.length === 2) {
    return `${uniqueUsernames[0]} and ${uniqueUsernames[1]} reacted to your message`
  } else {
    return `${uniqueUsernames.slice(0, 2).join(', ')} and ${uniqueUsernames.length - 2} others reacted to your message`
  }
}

function mergeReactionBodies(oldBody: string, newBody: string): string {
  const emojiRegex = /reacted with (.+?) to:/
  const oldMatch = oldBody.match(emojiRegex)
  const newMatch = newBody.match(emojiRegex)
  
  if (oldMatch && newMatch) {
    const oldEmojis = oldMatch[1].split(',').map(e => e.trim())
    const newEmoji = newMatch[1].trim()
    
    const uniqueEmojis = Array.from(new Set([...oldEmojis, newEmoji]))
    const messageContentMatch = newBody.match(/to:\s*(".*"|.*)$/)
    const messageContent = messageContentMatch ? messageContentMatch[1] : 'message'
    
    return `reacted with ${uniqueEmojis.join(', ')} to: ${messageContent}`
  }
  
  return newBody
}

function mergeMentionTitles(oldTitle: string, newTitle: string): string {
  const oldUsernames = oldTitle.match(/@([a-zA-Z0-9_-]+)/g) || []
  const newUsernames = newTitle.match(/@([a-zA-Z0-9_-]+)/g) || []
  
  const uniqueUsernames = Array.from(new Set([...oldUsernames, ...newUsernames]))
  if (uniqueUsernames.length === 0) {
    return "mentioned you in chat"
  } else if (uniqueUsernames.length === 1) {
    return `${uniqueUsernames[0]} mentioned you`
  } else if (uniqueUsernames.length === 2) {
    return `${uniqueUsernames[0]} and ${uniqueUsernames[1]} mentioned you`
  } else {
    return `${uniqueUsernames.slice(0, 2).join(', ')} and ${uniqueUsernames.length - 2} others mentioned you`
  }
}

function mergeMentionBodies(oldBody: string, newBody: string): string {
  if (oldBody.includes(newBody)) return oldBody
  const merged = `${oldBody} | ${newBody}`
  return merged.length > 200 ? merged.substring(0, 197) + '...' : merged
}

function mergeAchievementTitles(oldTitle: string, newTitle: string): string {
  return "achievements unlocked! 🏆"
}

function mergeAchievementBodies(oldBody: string, newBody: string): string {
  const cleanPrefix = (str: string) => str.replace(/^you\s+(unlocked:\s*)?/, '').trim()
  const oldClean = cleanPrefix(oldBody)
  const newClean = cleanPrefix(newBody)
  
  const items = [...oldClean.split(/\s*(?:&|\|)\s*/), newClean]
  const uniqueItems = Array.from(new Set(items.map(i => i.trim())))
  
  return `you unlocked: ${uniqueItems.join(' & ')}`
}

