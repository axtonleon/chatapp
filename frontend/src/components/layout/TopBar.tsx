import { useAuthStore } from '../../stores/authStore'
import Avatar from '../ui/Avatar'
import { MessageCircle, Search, Bell, Settings, ChevronDown } from 'lucide-react'

export default function TopBar() {
  const { user } = useAuthStore()

  return (
    <div className="h-[52px] bg-white border-b border-chat-border flex items-center justify-between px-4 shrink-0">
      {/* Left - App label */}
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary-500" />
        <span className="text-sm font-semibold text-gray-700">Message</span>
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-9 pr-16 py-1.5 rounded-lg bg-gray-50 border border-chat-border text-sm focus:outline-none focus:border-primary-500"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 bg-white border border-chat-border rounded px-1.5 py-0.5 font-sans">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-1">
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
          <Bell className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
          <Settings className="w-4 h-4" />
        </button>
        <div className="ml-2 flex items-center gap-1 cursor-pointer">
          <Avatar
            src={user?.avatar_url}
            name={user?.full_name || 'User'}
            size="sm"
            isOnline={true}
          />
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>
    </div>
  )
}
