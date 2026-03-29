export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  is_online: boolean
  last_seen?: string
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  message_type: string
  is_read: boolean
  created_at: string
  sender?: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

export interface Chat {
  id: string
  created_at: string
  is_ai_chat: boolean
  participants: User[]
  last_message?: Message
  unread_count: number
}
