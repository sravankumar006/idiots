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

export interface MessageSeen {
  id: string
  message_id: string
  user_id: string
  seen_at: string
  profiles?: UserProfile
}

export interface ChatMessage {
  id: string
  group_id: string
  sender_id: string
  message: string
  type: string // e.g., 'text', 'ai', 'media'
  category?: string // 'Study', 'Coding', 'Research', 'Projects', 'General'
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
  message_seen?: MessageSeen[]
  
  // UI states:
  sending?: boolean
  error?: boolean
  uploadProgress?: number // Realtime optimistic progress indicator
  aiMode?: 'pdf-generate' | 'image-analyze' | 'pdf-analyze' // multimodal AI response mode
}

export interface ProjectFile {
  id: string
  project_id: string
  name: string
  content: string
  created_at: string
  updated_at: string
}

export interface StudyRoom {
  id: string
  name: string
  description: string
  host_user_id: string
  room_status: 'waiting' | 'active' | 'completed'
  is_public: boolean
  created_at: string
  started_at: string | null
  ended_at: string | null
  profiles?: {
    username: string
    avatar: string
  }
}

export interface StudyRoomMember {
  id: string
  room_id: string
  user_id: string
  joined_at: string
  is_host: boolean
  status: 'joined' | 'ready'
  profiles?: {
    username: string
    avatar: string
  }
}

export interface StudyRoomComment {
  id: string
  room_id: string
  user_id: string
  message: string
  created_at: string
  profiles?: {
    username: string
    avatar: string
  }
}

export interface StudyRoomInvitation {
  id: string
  room_id: string
  inviter_user_id: string
  invitee_user_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  study_rooms?: {
    name: string
    description: string
    host_user_id: string
    is_public: boolean
  }
  inviter_profile?: {
    username: string
    avatar: string
  }
}

export interface StudyRoomTimer {
  room_id: string
  start_time: string | null
  duration_minutes: number
  status: 'idle' | 'running' | 'paused' | 'completed'
  elapsed_seconds: number
  updated_at: string
}


