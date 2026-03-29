import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useChatStore } from '../../stores/chatStore'
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
} from 'lucide-react'
import type { Chat, User } from '../../types'

interface Props {
  chat: Chat
}

export default function ChatArea({ chat }: Props) {
  const { user } = useAuthStore()
  const {
    messages,
    isLoadingMessages,
    sendMessage,
    sendAiMessage,
    addMessage,
    fetchMessages,
    onlineUsers,
  } = useChatStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [aiLoading, setAiLoading] = useState(false)

  const otherParticipant: User | undefined = chat.participants.find(
    (p) => p.id !== user?.id,
  )

  const isOnline = otherParticipant
    ? onlineUsers.has(otherParticipant.id)
    : false

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Listen for typing events
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
    // Reset typing when switching chats
    setTypingUsers(new Set())
    return () => unsub()
  }, [chat.id])

  const handleSend = async (content: string) => {
    if (chat.is_ai_chat) {
      // Show user message immediately
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
        // Refetch from DB to get the real saved messages (user + AI response)
        await fetchMessages(chat.id)
      }
    } else {
      sendMessage(chat.id, content)
    }
  }

  return (
    <div className="flex-1 flex h-full">
      <div className="flex-1 flex flex-col bg-chat-bg">
        {/* Chat header */}
        <div className="px-4 py-3 bg-white border-b border-chat-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            {chat.is_ai_chat ? (
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
            ) : (
              <button onClick={() => setShowContactInfo(!showContactInfo)}>
                <Avatar
                  src={otherParticipant?.avatar_url}
                  name={otherParticipant?.full_name || 'User'}
                  size="md"
                  isOnline={isOnline}
                />
              </button>
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {chat.is_ai_chat
                  ? 'AI Assistant'
                  : otherParticipant?.full_name || 'User'}
              </h3>
              <p className="text-xs text-gray-500">
                {chat.is_ai_chat ? (
                  <span className="text-purple-500">Powered by Gemini</span>
                ) : isOnline ? (
                  <span className="text-primary-500">Online</span>
                ) : (
                  'Offline'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
              <Search className="w-4 h-4" />
            </button>
            {!chat.is_ai_chat && (
              <>
                <button className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <Video className="w-4 h-4" />
                </button>
              </>
            )}
            <button className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Date separator */}
              {messages.length > 0 && (
                <div className="flex items-center justify-center mb-4">
                  <span className="px-3 py-1 bg-white/80 rounded-md text-[11px] text-gray-500 shadow-sm">
                    Today
                  </span>
                </div>
              )}

              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={msg.sender_id === user?.id}
                />
              ))}

              {typingUsers.size > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="px-3 py-2 bg-white rounded-lg shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      />
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {aiLoading && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="px-3 py-2 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex gap-1 items-center">
                      <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                      <span className="text-xs text-purple-400">
                        AI is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <MessageInput
          chatId={chat.id}
          onSend={handleSend}
          isAiChat={chat.is_ai_chat}
        />
      </div>

      {/* Contact info panel */}
      {!chat.is_ai_chat && otherParticipant && (
        <ContactInfo
          user={otherParticipant}
          isOpen={showContactInfo}
          onClose={() => setShowContactInfo(false)}
        />
      )}
    </div>
  )
}
