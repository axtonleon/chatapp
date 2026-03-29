import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useChatStore } from '../../stores/chatStore'
import Avatar from '../ui/Avatar'
import NewMessageModal from './NewMessageModal'
import { Search, Filter, Sparkles, CheckCheck, Edit3, MessageCircle, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import type { Chat } from '../../types'

export default function ChatList() {
  const { user } = useAuthStore()
  const { chats, activeChat, setActiveChat, onlineUsers, fetchChats, deleteChat } =
    useChatStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ chatId: string; x: number; y: number } | null>(null)

  const getOtherParticipant = (chat: Chat) => {
    return chat.participants.find((p) => p.id !== user?.id) || chat.participants[0]
  }

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true
    if (chat.is_ai_chat) return 'ai'.includes(searchQuery.toLowerCase())
    const other = getOtherParticipant(chat)
    return other?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handleChatCreated = async (chat: any) => {
    await fetchChats()
    setActiveChat({
      ...chat,
      is_ai_chat: false,
      participants: [],
      unread_count: 0,
    })
  }

  const handleContextMenu = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault()
    setContextMenu({ chatId, x: e.clientX, y: e.clientY })
  }

  const handleDelete = async () => {
    if (contextMenu) {
      await deleteChat(contextMenu.chatId)
      setContextMenu(null)
    }
  }

  return (
    <div className="w-[300px] min-w-[300px] bg-white border-r border-chat-border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-chat-border shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">All Message</h2>
          <button
            onClick={() => setShowNewMessage(true)}
            className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            New Message
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in message"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 border border-chat-border text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-chat-border text-gray-400 hover:bg-gray-50">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto relative">
        {showNewMessage && (
          <NewMessageModal
            isOpen={showNewMessage}
            onClose={() => setShowNewMessage(false)}
            onChatCreated={handleChatCreated}
          />
        )}

        {filteredChats.map((chat) => {
          const other = chat.is_ai_chat ? null : getOtherParticipant(chat)
          const isActive = activeChat?.id === chat.id
          const isOnline = other ? onlineUsers.has(other.id) : false
          const hasUnread = chat.unread_count > 0
          const isMineLastMsg = chat.last_message?.sender_id === user?.id

          return (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              onContextMenu={(e) => handleContextMenu(e, chat.id)}
              className={clsx(
                'w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition border-b border-chat-border/50',
                isActive && 'bg-gray-50',
              )}
            >
              {/* Unread badge */}
              {hasUnread && (
                <div className="shrink-0 flex flex-col items-center justify-center bg-primary-500 text-white rounded-lg px-1.5 py-2 self-stretch">
                  <MessageCircle className="w-3.5 h-3.5 mb-0.5" />
                  <span className="text-[8px] font-bold leading-none">Unread</span>
                </div>
              )}

              {/* Avatar */}
              <div className="relative shrink-0 mt-0.5">
                {chat.is_ai_chat ? (
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                  </div>
                ) : (
                  <Avatar
                    src={other?.avatar_url}
                    name={other?.full_name || 'User'}
                    size="md"
                    isOnline={isOnline}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {chat.is_ai_chat
                      ? 'AI Assistant'
                      : other?.full_name || 'User'}
                  </p>
                  {chat.last_message && (
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      {formatDistanceToNow(
                        new Date(chat.last_message.created_at),
                        { addSuffix: false },
                      )}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {isMineLastMsg && chat.last_message && (
                    <CheckCheck
                      className={clsx(
                        'w-3.5 h-3.5 shrink-0',
                        chat.last_message.is_read
                          ? 'text-primary-500'
                          : 'text-gray-300',
                      )}
                    />
                  )}
                  <p className="text-xs text-gray-500 truncate">
                    {chat.last_message?.content || 'No messages yet'}
                  </p>
                </div>
              </div>
            </button>
          )
        })}

        {filteredChats.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <svg
              className="w-12 h-12 mx-auto text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm mt-2">No conversations yet</p>
          </div>
        )}
      </div>

      {/* Right-click context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed bg-white rounded-lg shadow-lg border border-chat-border py-1 z-50 w-44"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={handleDelete}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete chat
            </button>
          </div>
        </>
      )}
    </div>
  )
}
