import { useAuthStore } from '../../stores/authStore'
import { useChatStore } from '../../stores/chatStore'
import Avatar from '../ui/Avatar'
import {
  Home,
  MessageCircle,
  Compass,
  FolderOpen,
  Image,
  LogOut,
  Sparkles,
  ArrowLeft,
  PenLine,
  Gift,
  Palette,
} from 'lucide-react'
import clsx from 'clsx'
import { useState } from 'react'

interface Props {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function Sidebar({ activeTab, onTabChange }: Props) {
  const { user, logout } = useAuthStore()
  const { createAiChat, setActiveChat, fetchChats } = useChatStore()
  const [showMenu, setShowMenu] = useState(false)

  const navItems = [
    { id: 'home', icon: Home },
    { id: 'messages', icon: MessageCircle },
    { id: 'links', icon: Compass },
    { id: 'files', icon: FolderOpen },
    { id: 'gallery', icon: Image },
  ]

  const handleAiChat = async () => {
    const { chats } = useChatStore.getState()
    const existingAi = chats.find((c) => c.is_ai_chat)
    if (existingAi) {
      setActiveChat(existingAi)
    } else {
      const chat = await createAiChat()
      await fetchChats()
      setActiveChat({ ...chat, is_ai_chat: true, participants: [], unread_count: 0 })
    }
    onTabChange('messages')
  }

  return (
    <div className="w-[76px] flex flex-col items-center px-4 py-6 justify-between shrink-0">
      {/* Top: logo + nav icons */}
      <div className="flex flex-col items-center gap-8 w-[44px]">
        {/* Logo */}
        <div
          className="w-[44px] h-[44px] bg-primary-500 rounded-full flex items-center justify-center cursor-pointer"
          onClick={() => setShowMenu(!showMenu)}
        >
          <PenLine className="w-[22px] h-[22px] text-white" />
        </div>

        {/* Nav items */}
        <nav className="flex flex-col items-center gap-2 w-[44px]">
          {navItems.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={clsx(
                'w-[44px] h-[44px] rounded-lg flex items-center justify-center transition-all',
                activeTab === id
                  ? 'bg-[#F0FDF4] border border-[#1E9A80]'
                  : 'hover:bg-gray-50',
              )}
            >
              <Icon className="w-5 h-5 text-[#151515]" />
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom: star + avatar */}
      <div className="flex flex-col items-center gap-6 w-[44px] relative">
        <button
          onClick={handleAiChat}
          className="w-[44px] h-[44px] rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          title="Chat with AI"
        >
          <Sparkles className="w-5 h-5 text-[#151515]" />
        </button>

        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)}>
            <div className="w-[44px] h-[44px] rounded-full overflow-hidden">
              <Avatar
                src={user?.avatar_url}
                name={user?.full_name || 'User'}
                size="md"
                isOnline={false}
                className="!w-[44px] !h-[44px]"
              />
            </div>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute bottom-full left-full ml-2 mb-2 bg-white rounded-xl shadow-xl border border-chat-border py-2 w-[260px] z-50">
                <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                  <ArrowLeft className="w-4 h-4 text-gray-400" />
                  Go back to dashboard
                </button>
                <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100">
                  <PenLine className="w-4 h-4 text-gray-400" />
                  Rename file
                </button>
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {user?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Credits</span>
                      <span>Renews in</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-semibold text-gray-900 mb-2">
                      <span>20 left</span>
                      <span>6h 24m</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: '20%' }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>5 of 25 used today</span>
                      <span className="text-primary-500 font-medium">+25 tomorrow</span>
                    </div>
                  </div>
                </div>
                <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                  <Gift className="w-4 h-4 text-gray-400" />
                  Win free credits
                </button>
                <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                  <Palette className="w-4 h-4 text-gray-400" />
                  Theme Style
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false)
                    logout()
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-t border-gray-100"
                >
                  <LogOut className="w-4 h-4 text-gray-400" />
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
