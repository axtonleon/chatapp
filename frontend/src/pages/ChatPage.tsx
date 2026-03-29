import { useEffect, useState } from 'react'
import { useChatStore } from '../stores/chatStore'
import TopBar from '../components/layout/TopBar'
import Sidebar from '../components/layout/Sidebar'
import ChatList from '../components/chat/ChatList'
import ChatArea from '../components/chat/ChatArea'
import { wsManager } from '../lib/websocket'
import { MessageCircle } from 'lucide-react'

export default function ChatPage() {
  const {
    activeChat,
    fetchChats,
    fetchUsers,
    addMessage,
    updateUserStatus,
    fetchMessages,
  } = useChatStore()
  const [activeTab, setActiveTab] = useState('messages')

  useEffect(() => {
    fetchChats()
    // Fetch users once on mount (for the New Message modal)
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

    return () => {
      unsubMessage()
      unsubStatus()
      unsubRead()
    }
  }, [])

  return (
    <div className="flex h-screen bg-chat-bg">
      {/* Sidebar — full height */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Right side — TopBar + content */}
      <div className="flex-1 flex flex-col min-h-0">
        <TopBar />
        <div className="flex flex-1 min-h-0">
          <ChatList />
          {activeChat ? (
            <ChatArea chat={activeChat} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-chat-bg">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                  Welcome to ChatApp
                </h3>
                <p className="text-sm text-gray-400">
                  Select a conversation or start a new message
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
