export interface UserProfile {
  id: string
  username: string
  email: string
  avatar: string // identifier of chosen avatar (e.g. 'avatar-cyber-ghost')
  created_at: string
}

export interface AuthState {
  user: UserProfile | null
  loading: boolean
  error: string | null
}

export interface ChatGroup {
  id: string
  group_name: string
  created_by: string | null
  created_at: string
}

export interface ChatReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
  profiles?: UserProfile // Joined profile of the user who reacted
}

export interface ChatMessage {
  id: string
  group_id: string
  sender_id: string
  message: string
  type: string // e.g., 'text', 'ai', 'media'
  reply_to: string | null // parent message ID for replies
  created_at: string
  profiles?: UserProfile // Joined sender profile
  
  // File attachments (Supabase Storage fields)
  file_url?: string | null
  file_name?: string | null
  file_size?: number | null

  // Custom properties computed on the client side:
  replied_message?: {
    id: string
    message: string
    sender_name: string
  } | null
  reactions?: ChatReaction[]
  
  // UI states:
  sending?: boolean
  error?: boolean
  uploadProgress?: number // Realtime optimistic progress indicator
}
