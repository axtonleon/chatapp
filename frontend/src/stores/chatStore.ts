import { create } from 'zustand'
import api from '../lib/api'
import { wsManager } from '../lib/websocket'
import type { Chat, Message, User } from '../types'

interface ChatState {
  chats: Chat[]
  activeChat: Chat | null
  messages: Message[]
  users: User[]
  onlineUsers: Set<string>
  isLoadingChats: boolean
  isLoadingMessages: boolean
  fetchChats: () => Promise<void>
  fetchUsers: () => Promise<void>
  fetchMessages: (chatId: string) => Promise<void>
  setActiveChat: (chat: Chat | null) => void
  createChat: (participantId: string) => Promise<Chat>
  createAiChat: () => Promise<Chat>
  sendMessage: (chatId: string, content: string) => void
  sendAiMessage: (chatId: string, content: string) => Promise<any>
  addMessage: (message: Message) => void
  updateUserStatus: (userId: string, isOnline: boolean) => void
  deleteChat: (chatId: string) => Promise<void>
  markAsRead: (chatId: string) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChat: null,
  messages: [],
  users: [],
  onlineUsers: new Set(),
  isLoadingChats: false,
  isLoadingMessages: false,

  fetchChats: async () => {
    set({ isLoadingChats: true })
    try {
      const res = await api.get('/chats/')
      set({ chats: res.data, isLoadingChats: false })
    } catch {
      set({ isLoadingChats: false })
    }
  },

  fetchUsers: async () => {
    try {
      const res = await api.get('/users/')
      const onlineUsers = new Set<string>()
      res.data.forEach((u: User) => {
        if (u.is_online) onlineUsers.add(u.id)
      })
      set({ users: res.data, onlineUsers })
    } catch {}
  },

  fetchMessages: async (chatId: string) => {
    set({ isLoadingMessages: true })
    try {
      const res = await api.get(`/messages/${chatId}`)
      set({ messages: res.data, isLoadingMessages: false })
    } catch {
      set({ isLoadingMessages: false })
    }
  },

  setActiveChat: (chat) => {
    set({ activeChat: chat, messages: [] })
    if (chat) {
      get().fetchMessages(chat.id)
      get().markAsRead(chat.id)
    }
  },

  createChat: async (participantId: string) => {
    const res = await api.post('/chats/', { participant_id: participantId })
    await get().fetchChats()
    return res.data
  },

  createAiChat: async () => {
    const res = await api.post('/chats/ai')
    await get().fetchChats()
    return res.data
  },

  sendMessage: (chatId: string, content: string) => {
    wsManager.send({
      type: 'message',
      chat_id: chatId,
      content,
      message_type: 'text',
    })
  },

  sendAiMessage: async (chatId: string, content: string) => {
    const res = await api.post('/ai/chat', { message: content, chat_id: chatId })
    return res.data
  },

  addMessage: (message: Message) => {
    const { activeChat } = get()
    if (activeChat && message.chat_id === activeChat.id) {
      set((state) => ({ messages: [...state.messages, message] }))
    }
    set((state) => ({
      chats: state.chats
        .map((chat) =>
          chat.id === message.chat_id
            ? {
                ...chat,
                last_message: message,
                unread_count:
                  activeChat?.id === chat.id
                    ? chat.unread_count
                    : chat.unread_count + 1,
              }
            : chat,
        )
        .sort((a, b) => {
          const aTime = a.last_message?.created_at || a.created_at
          const bTime = b.last_message?.created_at || b.created_at
          return new Date(bTime).getTime() - new Date(aTime).getTime()
        }),
    }))
  },

  updateUserStatus: (userId: string, isOnline: boolean) => {
    set((state) => {
      const newOnline = new Set(state.onlineUsers)
      if (isOnline) newOnline.add(userId)
      else newOnline.delete(userId)
      return {
        onlineUsers: newOnline,
        users: state.users.map((u) =>
          u.id === userId ? { ...u, is_online: isOnline } : u,
        ),
      }
    })
  },

  deleteChat: async (chatId: string) => {
    await api.delete(`/chats/${chatId}`)
    const { activeChat } = get()
    if (activeChat?.id === chatId) {
      set({ activeChat: null, messages: [] })
    }
    set((state) => ({
      chats: state.chats.filter((c) => c.id !== chatId),
    }))
  },

  markAsRead: (chatId: string) => {
    wsManager.send({ type: 'read', chat_id: chatId })
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, unread_count: 0 } : chat,
      ),
    }))
  },
}))
