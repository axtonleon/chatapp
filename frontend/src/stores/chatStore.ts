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
  showContactInfo: boolean
  setShowContactInfo: (show: boolean) => void
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
  archiveChat: (chatId: string) => Promise<void>
  unarchiveChat: (chatId: string) => Promise<void>
  muteChat: (chatId: string) => Promise<void>
  unmuteChat: (chatId: string) => Promise<void>
  clearChat: (chatId: string) => Promise<void>
  markChatUnread: (chatId: string) => Promise<void>
  exportChat: (chatId: string) => Promise<void>
  uploadFile: (chatId: string, file: File) => Promise<void>
  editMessage: (messageId: string, content: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  editingMessage: Message | null
  setEditingMessage: (msg: Message | null) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChat: null,
  messages: [],
  users: [],
  onlineUsers: new Set(),
  showContactInfo: false,
  setShowContactInfo: (show) => set({ showContactInfo: show }),
  editingMessage: null,
  setEditingMessage: (msg) => set({ editingMessage: msg }),
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
    const { activeChat, messages } = get()

    // Prevent duplicate messages
    const isDuplicate = messages.some((m) => m.id === message.id)

    if (activeChat && message.chat_id === activeChat.id && !isDuplicate) {
      set((state) => ({ messages: [...state.messages, message] }))
    }

    // Update chat list (last message + unread count)
    const chatExists = get().chats.some((c) => c.id === message.chat_id)
    if (!chatExists) {
      // New chat from someone — refetch the full list
      get().fetchChats()
      return
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

  archiveChat: async (chatId: string) => {
    await api.post(`/chats/${chatId}/archive`)
    const { activeChat } = get()
    if (activeChat?.id === chatId) {
      set({ activeChat: null, messages: [] })
    }
    set((state) => ({
      chats: state.chats.map((c) => c.id === chatId ? { ...c, is_archived: true } : c),
    }))
  },

  unarchiveChat: async (chatId: string) => {
    await api.post(`/chats/${chatId}/unarchive`)
    set((state) => ({
      chats: state.chats.map((c) => c.id === chatId ? { ...c, is_archived: false } : c),
    }))
  },

  muteChat: async (chatId: string) => {
    await api.post(`/chats/${chatId}/mute`)
    set((state) => ({
      chats: state.chats.map((c) => c.id === chatId ? { ...c, is_muted: true } : c),
    }))
  },

  unmuteChat: async (chatId: string) => {
    await api.post(`/chats/${chatId}/unmute`)
    set((state) => ({
      chats: state.chats.map((c) => c.id === chatId ? { ...c, is_muted: false } : c),
    }))
  },

  clearChat: async (chatId: string) => {
    await api.post(`/chats/${chatId}/clear`)
    const { activeChat } = get()
    if (activeChat?.id === chatId) {
      set({ messages: [] })
    }
    await get().fetchChats()
  },

  markChatUnread: async (chatId: string) => {
    await api.post(`/chats/${chatId}/mark-unread`)
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, unread_count: Math.max(chat.unread_count, 1) } : chat,
      ),
    }))
  },

  exportChat: async (chatId: string) => {
    const { chats } = get()
    const chat = chats.find((c) => c.id === chatId)
    const res = await api.get(`/messages/${chatId}`)
    const messages: Message[] = res.data
    const lines = messages.map((m) => {
      const time = new Date(m.created_at).toLocaleString()
      return `[${time}] ${m.sender_id}: ${m.content}`
    })
    const text = `Chat export: ${chat?.id || chatId}\n${'='.repeat(40)}\n${lines.join('\n')}`
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-export-${chatId.slice(0, 8)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  },

  uploadFile: async (chatId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('chat_id', chatId)
    const res = await api.post('/messages/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const msg = res.data
    get().addMessage(msg)
    await get().fetchChats()
  },

  editMessage: async (messageId: string, content: string) => {
    await api.put(`/messages/${messageId}`, { content })
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, content } : m
      ),
      editingMessage: null,
    }))
    await get().fetchChats()
  },

  deleteMessage: async (messageId: string) => {
    await api.delete(`/messages/${messageId}`)
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }))
    await get().fetchChats()
  },
}))
