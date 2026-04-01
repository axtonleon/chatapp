import { useAuthStore } from '../../stores/authStore'
import Avatar from '../ui/Avatar'
import { MessageCircle, Search, Bell, Settings, ChevronDown } from 'lucide-react'

export default function TopBar() {
  const { user } = useAuthStore()

  return (
    <div className="bg-white flex flex-col items-start px-4 md:px-6 py-3 shrink-0 rounded-2xl h-14">
      <div className="flex items-center justify-between w-full h-8">
        {/* page-label */}
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-[#596881]" strokeWidth={1.875} />
          <span className="text-sm font-medium text-heading tracking-tight leading-5">Message</span>
        </div>

        {/* right-column */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* search — hidden on mobile */}
          <div className="hidden md:flex items-center gap-3">
            <div className="relative w-[300px] h-8">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8796AF]" strokeWidth={1.05} />
              <input
                type="text"
                placeholder="Search"
                className="w-full h-full pl-8 pr-14 rounded-[10px] bg-white border border-chat-border text-xs text-[#8796AF] placeholder:text-[#8796AF] focus:outline-none focus:border-primary-500"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center px-1.5 py-1 bg-chat-bg rounded-md">
                <span className="text-xs text-[#404040] leading-4">⌘K</span>
              </div>
            </div>

            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-chat-border bg-white hover:bg-gray-50 transition">
              <Bell className="w-4 h-4 text-[#262626]" strokeWidth={1.5} />
            </button>

            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-chat-border bg-white hover:bg-gray-50 transition">
              <Settings className="w-4 h-4 text-[#262626]" strokeWidth={1.5} />
            </button>
          </div>

          {/* Mobile: just bell */}
          <button className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg border border-chat-border bg-white hover:bg-gray-50 transition">
            <Bell className="w-4 h-4 text-[#262626]" strokeWidth={1.5} />
          </button>

          {/* Divider — hidden on mobile */}
          <div className="hidden md:block w-px h-5 border-r border-chat-border" />

          {/* profile */}
          <div className="flex items-center gap-2 cursor-pointer">
            <Avatar
              src={user?.avatar_url}
              name={user?.full_name || 'User'}
              size="sm"
              isOnline={false}
            />
            <ChevronDown className="hidden md:block w-4 h-4 text-[#262626]" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </div>
  )
}
