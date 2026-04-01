import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useChatStore } from '../../stores/chatStore'
import { useCallStore } from '../../stores/callStore'
import { wsManager } from '../../lib/websocket'
import Avatar from '../ui/Avatar'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import ContactInfo from './ContactInfo'
import {
  Search,
  Phone,
  Video,
  MoreHorizontal,
  Sparkles,
  X,
  ChevronUp,
  ChevronDown,
  UserCircle,
  VolumeX,
  Volume2,
  Trash2,
  Upload,
  ArrowLeft,
} from 'lucide-react'
import type { Chat, User } from '../../types'

interface Props {
  chat: Chat
  onBack?: () => void
}

export default function ChatArea({ chat, onBack }: Props) {
  const { user } = useAuthStore()
  const {
    messages,
    isLoadingMessages,
    sendMessage,
    sendAiMessage,
    addMessage,
    fetchMessages,
    onlineUsers,
    showContactInfo,
    setShowContactInfo,
    muteChat,
    unmuteChat,
    clearChat,
    deleteChat,
    exportChat,
    chats,
  } = useChatStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [aiLoading, setAiLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMatches, setSearchMatches] = useState<number[]>([])
  const [searchIndex, setSearchIndex] = useState(0)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const otherParticipant: User | undefined = chat.participants.find(
    (p) => p.id !== user?.id,
  )

  const isOnline = otherParticipant
    ? onlineUsers.has(otherParticipant.id)
    : false

  const currentChat = chats.find((c) => c.id === chat.id)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const unsub = wsManager.on('typing', (data) => {
      if (data.chat_id !== chat.id) return
      setTypingUsers((prev) => {
        const next = new Set(prev)
        if (data.is_typing) {
          next.add(data.user_id)
        } else {
          next.delete(data.user_id)
        }
        return next
      })
    })
    setTypingUsers(new Set())
    return () => unsub()
  }, [chat.id])

  // Reset search when switching chats
  useEffect(() => {
    setShowSearch(false)
    setSearchQuery('')
    setSearchMatches([])
    setSearchIndex(0)
    setShowMoreMenu(false)
  }, [chat.id])

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchMatches([])
      setSearchIndex(0)
      return
    }
    const q = searchQuery.toLowerCase()
    const matches = messages
      .map((m, i) => (m.content.toLowerCase().includes(q) ? i : -1))
      .filter((i) => i !== -1)
    setSearchMatches(matches)
    setSearchIndex(matches.length > 0 ? matches.length - 1 : 0)
  }, [searchQuery, messages])

  // Scroll to matched message
  useEffect(() => {
    if (searchMatches.length === 0) return
    const msgIndex = searchMatches[searchIndex]
    const el = document.getElementById(`msg-${messages[msgIndex]?.id}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [searchIndex, searchMatches])

  const handleSend = async (content: string) => {
    if (chat.is_ai_chat) {
      addMessage({
        id: 'temp-' + Date.now(),
        chat_id: chat.id,
        sender_id: user!.id,
        content,
        message_type: 'text',
        is_read: true,
        created_at: new Date().toISOString(),
      })
      setAiLoading(true)
      try {
        await sendAiMessage(chat.id, content)
      } catch (err) {
        console.error('AI chat error:', err)
      } finally {
        setAiLoading(false)
        await fetchMessages(chat.id)
      }
    } else {
      sendMessage(chat.id, content)
    }
  }

  const highlightId = searchMatches.length > 0 ? messages[searchMatches[searchIndex]]?.id : null

  return (
    <div className="flex-1 flex h-full min-w-0 relative">
      <div className="flex-1 flex flex-col bg-white rounded-3xl overflow-hidden min-w-0 p-3 items-center">
        {/* Header */}
        <div className="w-full px-3 pt-1 pb-4 flex items-center gap-2 md:gap-3 shrink-0">
          {/* Back button — mobile only */}
          {onBack && (
            <button onClick={onBack} className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-heading shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {chat.is_ai_chat ? (
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
            ) : (
              <button className="shrink-0" onClick={() => setShowContactInfo(!showContactInfo)}>
                <Avatar
                  src={otherParticipant?.avatar_url}
                  name={otherParticipant?.full_name || 'User'}
                  size="md"
                  isOnline={isOnline}
                />
              </button>
            )}
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <h3 className="text-sm font-medium text-heading tracking-tight leading-5">
                {chat.is_ai_chat ? 'AI Assistant' : otherParticipant?.full_name || 'User'}
              </h3>
              <p className="text-xs font-medium leading-4">
                {chat.is_ai_chat ? (
                  <span className="text-purple-500">Powered by Gemini</span>
                ) : isOnline ? (
                  <span className="text-online">Online</span>
                ) : (
                  <span className="text-muted">Offline</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); setSearchMatches([]) }}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-chat-border bg-white hover:bg-gray-50"
            >
              <Search className="w-4 h-4 text-[#262626]" strokeWidth={1.5} />
            </button>
            {!chat.is_ai_chat && (
              <>
                <button
                  onClick={() => useCallStore.getState().startCall(otherParticipant!.id, otherParticipant!.full_name, 'audio')}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-chat-border bg-white hover:bg-gray-50"
                >
                  <Phone className="w-4 h-4 text-[#262626]" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => useCallStore.getState().startCall(otherParticipant!.id, otherParticipant!.full_name, 'video')}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-chat-border bg-white hover:bg-gray-50"
                >
                  <Video className="w-4 h-4 text-[#262626]" strokeWidth={1.5} />
                </button>
              </>
            )}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-chat-border bg-white hover:bg-gray-50"
              >
                <MoreHorizontal className="w-4 h-4 text-[#262626]" strokeWidth={1.5} />
              </button>
              {/* More options menu */}
              {showMoreMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                  <div
                    className="absolute top-full right-0 mt-2 bg-white rounded-2xl border border-chat-border p-2 z-50 w-[200px] flex flex-col gap-1"
                    style={{ boxShadow: '0px 0px 24px rgba(0,0,0,0.06)' }}
                  >
                    {!chat.is_ai_chat && (
                      <button
                        onClick={() => { setShowContactInfo(true); setShowMoreMenu(false) }}
                        className="w-full px-2 py-1.5 text-left text-sm font-medium text-heading hover:bg-chat-hover rounded-lg flex items-center gap-2.5"
                      >
                        <UserCircle className="w-4 h-4" />
                        Contact info
                      </button>
                    )}
                    {currentChat?.is_muted ? (
                      <button
                        onClick={() => { unmuteChat(chat.id); setShowMoreMenu(false) }}
                        className="w-full px-2 py-1.5 text-left text-sm font-medium text-heading hover:bg-chat-hover rounded-lg flex items-center gap-2.5"
                      >
                        <Volume2 className="w-4 h-4" />
                        Unmute
                      </button>
                    ) : (
                      <button
                        onClick={() => { muteChat(chat.id); setShowMoreMenu(false) }}
                        className="w-full px-2 py-1.5 text-left text-sm font-medium text-heading hover:bg-chat-hover rounded-lg flex items-center gap-2.5"
                      >
                        <VolumeX className="w-4 h-4" />
                        Mute
                      </button>
                    )}
                    <button
                      onClick={() => { exportChat(chat.id); setShowMoreMenu(false) }}
                      className="w-full px-2 py-1.5 text-left text-sm font-medium text-heading hover:bg-chat-hover rounded-lg flex items-center gap-2.5"
                    >
                      <Upload className="w-4 h-4" />
                      Export chat
                    </button>
                    <button
                      onClick={() => { clearChat(chat.id); setShowMoreMenu(false) }}
                      className="w-full px-2 py-1.5 text-left text-sm font-medium text-heading hover:bg-chat-hover rounded-lg flex items-center gap-2.5"
                    >
                      <X className="w-4 h-4" />
                      Clear chat
                    </button>
                    <button
                      onClick={() => { deleteChat(chat.id); setShowMoreMenu(false) }}
                      className="w-full px-2 py-1.5 text-left text-sm font-medium text-destructive hover:bg-red-50 rounded-lg flex items-center gap-2.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete chat
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="w-full px-3 pb-3 shrink-0 flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in conversation..."
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-chat-bg border border-chat-border text-xs text-body placeholder:text-placeholder focus:outline-none focus:border-primary-500"
                autoFocus
              />
            </div>
            {searchMatches.length > 0 && (
              <span className="text-xs text-muted whitespace-nowrap">
                {searchIndex + 1}/{searchMatches.length}
              </span>
            )}
            <button
              onClick={() => setSearchIndex((prev) => (prev > 0 ? prev - 1 : searchMatches.length - 1))}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-muted"
              disabled={searchMatches.length === 0}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSearchIndex((prev) => (prev < searchMatches.length - 1 ? prev + 1 : 0))}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-muted"
              disabled={searchMatches.length === 0}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchMatches([]) }}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Message content */}
        <div className="flex-1 w-full flex flex-col bg-chat-bg rounded-2xl overflow-hidden min-h-0 p-3 gap-3">
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col justify-end min-h-full gap-3">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {messages.length > 0 && (
                    <div className="flex items-center justify-center mb-3">
                      <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-[#596881]">
                        Today
                      </span>
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const prev = messages[i - 1]
                    const next = messages[i + 1]
                    const sameSenderAsPrev = prev && prev.sender_id === msg.sender_id
                    const sameSenderAsNext = next && next.sender_id === msg.sender_id
                    return (
                      <div key={msg.id} id={`msg-${msg.id}`}>
                        <MessageBubble
                          message={msg}
                          isMine={msg.sender_id === user?.id}
                          isFirst={!sameSenderAsPrev}
                          isLast={!sameSenderAsNext}
                          highlight={msg.id === highlightId}
                        />
                      </div>
                    )
                  })}
                  {typingUsers.size > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="px-3 py-2 bg-white rounded-lg shadow-sm">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  {aiLoading && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="px-3 py-2 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="flex gap-1 items-center">
                          <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                          <span className="text-xs text-purple-400">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="w-full pt-2 shrink-0">
          <MessageInput chatId={chat.id} onSend={handleSend} isAiChat={chat.is_ai_chat} />
        </div>
      </div>

      {/* Contact info */}
      {!chat.is_ai_chat && otherParticipant && showContactInfo && (
        <ContactInfo user={otherParticipant} isOpen={showContactInfo} onClose={() => setShowContactInfo(false)} />
      )}
    </div>
  )
}
