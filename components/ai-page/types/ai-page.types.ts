export interface LogItem {
  id: string
  prompt: string
  response: string | null
  model: string
  created_at: string
  room_id: string | null
  provider: string | null
  response_time_ms: number | null
  success: boolean | null
  error_message: string | null
  profiles: {
    id: string
    username: string
    avatar: string
  } | null
  groups: {
    id: string
    group_name: string
  } | null
}
