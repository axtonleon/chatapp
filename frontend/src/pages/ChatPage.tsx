import { useEffect, useState } from 'react'
import { useChatStore } from '../stores/chatStore'
import { useCallStore } from '../stores/callStore'
import TopBar from '../components/layout/TopBar'
import Sidebar from '../components/layout/Sidebar'
import ChatList from '../components/chat/ChatList'
import ChatArea from '../components/chat/ChatArea'
import CallOverlay from '../components/chat/CallOverlay'
import { wsManager } from '../lib/websocket'
import { MessageCircle } from 'lucide-react'

export default function ChatPage() {
  const {
    activeChat,
    setActiveChat,
    fetchChats,
    fetchUsers,
    addMessage,
    updateUserStatus,
    fetchMessages,
  } = useChatStore()
  const [activeTab, setActiveTab] = useState('messages')

  useEffect(() => {
    fetchChats()
    fetchUsers()

    const unsubMessage = wsManager.on('new_message', (data) => {
      addMessage(data.message)
    })

    const unsubStatus = wsManager.on('user_status', (data) => {
      updateUserStatus(data.user_id, data.is_online)
    })

    const unsubRead = wsManager.on('messages_read', (data) => {
      const { activeChat } = useChatStore.getState()
      if (activeChat && activeChat.id === data.chat_id) {
        fetchMessages(activeChat.id)
      }
    })

    const unsubCall = wsManager.on('call_offer', (data) => useCallStore.getState().handleIncoming(data))
    const unsubAnswer = wsManager.on('call_answer', (data) => useCallStore.getState().handleIncoming(data))
    const unsubIce = wsManager.on('ice_candidate', (data) => useCallStore.getState().handleIncoming(data))
    const unsubEnd = wsManager.on('call_end', (data) => useCallStore.getState().handleIncoming(data))
    const unsubReject = wsManager.on('call_reject', (data) => useCallStore.getState().handleIncoming(data))

    return () => {
      unsubMessage()
      unsubStatus()
      unsubRead()
      unsubCall()
      unsubAnswer()
      unsubIce()
      unsubEnd()
      unsubReject()
    }
  }, [])

  return (
    <div className="h-screen p-0 md:p-2">
      <div className="flex h-full bg-chat-bg md:rounded-3xl overflow-hidden">
        {/* Sidebar — hidden on mobile */}
        <div className="hidden md:flex">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Right side */}
        <div className="flex-1 flex flex-col min-h-0 p-2 md:p-3 gap-2 md:gap-3">
          {/* TopBar — hidden on mobile when viewing a chat */}
          <div className={activeChat ? 'hidden md:block' : ''}>
            <TopBar />
          </div>

          <div className="flex flex-1 min-h-0 gap-2 md:gap-3">
            {/* ChatList — full width on mobile, hidden when chat is open on mobile */}
            <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-[400px] md:min-w-[400px] md:shrink-0`}>
              <ChatList />
            </div>

            {/* ChatArea or welcome screen */}
            {activeChat ? (
              <ChatArea chat={activeChat} onBack={() => setActiveChat(null)} />
            ) : (
              <div className="hidden md:flex flex-1 items-center justify-center bg-white rounded-3xl">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-primary-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-heading mb-1">
                    Welcome to ChatApp
                  </h3>
                  <p className="text-sm text-muted">
                    Select a conversation or start a new message
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <CallOverlay />
    </div>
  )
}
