import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useChatStore } from '../../stores/chatStore'
import Avatar from '../ui/Avatar'
import NewMessageModal from './NewMessageModal'
import { Search, Filter, Sparkles, CheckCheck, Edit3, MessageCircle, Trash2, Archive, ArchiveRestore, VolumeX, Volume2, UserCircle, Upload, X, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import type { Chat } from '../../types'

export default function ChatList() {
  const { user } = useAuthStore()
  const { chats, activeChat, setActiveChat, onlineUsers, fetchChats, deleteChat, archiveChat, unarchiveChat, muteChat, unmuteChat, clearChat, markChatUnread, exportChat, setShowContactInfo } =
    useChatStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ chatId: string; x: number; y: number } | null>(null)

  const getOtherParticipant = (chat: Chat) => {
    return chat.participants.find((p) => p.id !== user?.id) || chat.participants[0]
  }

  const activeChats = chats.filter((c) => !c.is_archived)
  const archivedChats = chats.filter((c) => c.is_archived)

  const filteredChats = (showArchived ? archivedChats : activeChats).filter((chat) => {
    if (!searchQuery) return true
    if (chat.is_ai_chat) return 'ai'.includes(searchQuery.toLowerCase())
    const other = getOtherParticipant(chat)
    return other?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const contextChat = contextMenu ? chats.find((c) => c.id === contextMenu.chatId) : null

  const handleChatCreated = async (chat: any) => {
    await fetchChats()
    // Find the full chat with participants from the freshly fetched list
    const fullChat = useChatStore.getState().chats.find((c) => c.id === chat.id)
    if (fullChat) {
      setActiveChat(fullChat)
    } else {
      setActiveChat({
        ...chat,
        is_ai_chat: false,
        participants: [],
        unread_count: 0,
      })
    }
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

  const renderChatItem = (chat: Chat) => {
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
          'w-full h-16 p-3 flex items-center gap-3 hover:bg-chat-hover transition rounded-xl',
          isActive && 'bg-chat-hover',
        )}
      >
        {hasUnread && (
          <div className="shrink-0 flex flex-col items-center justify-center bg-primary-500 text-white rounded-lg px-1.5 py-2 self-stretch">
            <MessageCircle className="w-3.5 h-3.5 mb-0.5" />
            <span className="text-[8px] font-bold leading-none">Unread</span>
          </div>
        )}

        <div className="relative shrink-0">
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

        <div className="flex-1 min-w-0 text-left flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <p className="text-sm font-medium text-[#1C1C1C] truncate flex items-center gap-1 leading-5 tracking-tight">
              {chat.is_ai_chat ? 'AI Assistant' : other?.full_name || 'User'}
              {chat.is_muted && <VolumeX className="w-3 h-3 text-muted shrink-0" />}
            </p>
            {chat.last_message && (
              <span className="text-xs text-muted shrink-0">
                {formatDistanceToNow(new Date(chat.last_message.created_at), { addSuffix: false })}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-4">
            {isMineLastMsg && chat.last_message && (
              <CheckCheck
                className={clsx(
                  'w-4 h-4 shrink-0',
                  chat.last_message.is_read ? 'text-primary-500' : 'text-gray-300',
                )}
              />
            )}
            <p className="text-xs text-muted truncate">
              {chat.last_message
                ? chat.last_message.message_type === 'image'
                  ? '📷 Image'
                  : chat.last_message.message_type === 'file'
                    ? (chat.last_message.content.includes('audio/') ? '🎤 Voice note' : '📎 Document')
                    : chat.last_message.content
                : 'No messages yet'}
            </p>
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="w-full md:w-[400px] md:min-w-[400px] bg-white flex flex-col h-full overflow-hidden rounded-3xl shrink-0">
      {/* Header - padding 24px, gap 24px between sections */}
      <div className="p-6 shrink-0 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          {showArchived ? (
            <>
              <button onClick={() => setShowArchived(false)} className="flex items-center gap-2 text-heading hover:text-primary-500 transition">
                <ArrowLeft className="w-5 h-5" />
                <h2 className="text-[20px] font-semibold">Archived</h2>
              </button>
              <span className="text-sm text-muted">{archivedChats.length}</span>
            </>
          ) : (
            <>
              <h2 className="text-[20px] font-semibold text-heading">All Message</h2>
              <div className="relative">
                <button
                  onClick={() => setShowNewMessage(true)}
                  className="h-8 px-2 text-white text-sm font-medium rounded-lg hover:brightness-110 transition flex items-center gap-1.5 border border-primary-500"
                  style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%), #1E9A80', boxShadow: 'inset 0px 1px 0px 1px rgba(255,255,255,0.12)' }}
                >
                  <Edit3 className="w-[18px] h-[18px]" strokeWidth={1.3} />
                  New Message
                </button>
                {showNewMessage && (
                  <NewMessageModal
                    isOpen={showNewMessage}
                    onClose={() => setShowNewMessage(false)}
                    onChatCreated={handleChatCreated}
                  />
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#262626]" strokeWidth={1.2} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in message"
              className="w-full h-10 pl-9 pr-3 rounded-[10px] bg-white border border-chat-border text-sm text-[#404040] placeholder:text-[#404040] focus:outline-none focus:border-primary-500 tracking-tight"
            />
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-[10px] border border-chat-border bg-white hover:bg-gray-50 shrink-0">
            <Filter className="w-[18px] h-[18px] text-[#262626]" strokeWidth={1.3} />
          </button>
        </div>
      </div>

      {/* Chat list - messages container */}
      <div className="flex-1 overflow-y-auto relative px-6 pb-6">

        {/* Archived chats button (only in main view) */}
        {!showArchived && archivedChats.length > 0 && (
          <button
            onClick={() => setShowArchived(true)}
            className="w-full p-3 flex items-center gap-3 hover:bg-chat-hover transition rounded-xl mb-2 text-primary-500"
          >
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
              <Archive className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">Archived</p>
              <p className="text-xs text-muted">{archivedChats.length} chat{archivedChats.length !== 1 ? 's' : ''}</p>
            </div>
          </button>
        )}

        <div className="flex flex-col gap-2">
          {filteredChats.map(renderChatItem)}
        </div>

        {filteredChats.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">{showArchived ? 'No archived chats' : 'No conversations yet'}</p>
          </div>
        )}
      </div>

      {/* Right-click context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed bg-white rounded-2xl border border-chat-border p-2 z-50 w-[200px] flex flex-col gap-1"
            style={{ top: contextMenu.y, left: contextMenu.x, boxShadow: '0px 0px 24px rgba(0,0,0,0.06)' }}
          >
            <button onClick={() => { markChatUnread(contextMenu.chatId); setContextMenu(null) }} className="w-full px-2 py-1.5 text-left text-sm font-medium text-heading hover:bg-chat-hover rounded-lg flex items-center gap-2.5">
              <MessageCircle className="w-4 h-4" />
              Mark as unread
            </button>
            {contextChat?.is_archived ? (
              <button onClick={() => { unarchiveChat(contextMenu.chatId); setContextMenu(null) }} className="w-full px-2 py-1.5 text-left text-sm font-medium text-heading hover:bg-chat-hover rounded-lg flex items-center gap-2.5">
                <ArchiveRestore className="w-4 h-4" />
                Unarchive
              </button>
            ) : (
              <button onClick={() => { archiveChat(contextMenu.chatId); setContextMenu(null) }} className="w-full px-2 py-1.5 text-left text-sm font-medium text-heading hover:bg-chat-hover rounded-lg flex items-center gap-2.5">
                <Archive className="w-4 h-4" />
                Archive
              </button>
            )}
            {contextChat?.is_muted ? (
              <button onClick={() => { unmuteChat(contextMenu.chatId); setContextMenu(null) }} className="w-full px-2 py-1.5 text-left text-sm font-medium text-heading hover:bg-chat-hover rounded-lg flex items-center gap-2.5">
                <Volume2 className="w-4 h-4" />
                Unmute
              </button>
            ) : (
              <button onClick={() => { muteChat(contextMenu.chatId); setContextMenu(null) }} className="w-full px-2 py-1.5 text-left text-sm font-medium text-heading hover:bg-chat-hover rounded-lg flex items-center gap-2.5">
                <VolumeX className="w-4 h-4" />
                Mute
              </button>
            )}
            <button onClick={() => { const chat = chats.find(c => c.id === contextMenu.chatId); if (chat) { setActiveChat(chat); setShowContactInfo(true) } setContextMenu(null) }} className="w-full px-2 py-1.5 text-left text-sm font-medium text-heading hover:bg-chat-hover rounded-lg flex items-center gap-2.5">
              <UserCircle className="w-4 h-4" />
              Contact info
            </button>
            <button onClick={() => { exportChat(contextMenu.chatId); setContextMenu(null) }} className="w-full px-2 py-1.5 text-left text-sm font-medium text-heading hover:bg-chat-hover rounded-lg flex items-center gap-2.5">
              <Upload className="w-4 h-4" />
              Export chat
            </button>
            <button onClick={() => { clearChat(contextMenu.chatId); setContextMenu(null) }} className="w-full px-2 py-1.5 text-left text-sm font-medium text-heading hover:bg-chat-hover rounded-lg flex items-center gap-2.5">
              <X className="w-4 h-4" />
              Clear chat
            </button>
            <button
              onClick={handleDelete}
              className="w-full px-2 py-1.5 text-left text-sm font-medium text-destructive hover:bg-red-50 rounded-lg flex items-center gap-2.5"
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
