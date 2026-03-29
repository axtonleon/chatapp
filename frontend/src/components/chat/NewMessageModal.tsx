import { useState } from 'react'
import { useChatStore } from '../../stores/chatStore'
import Avatar from '../ui/Avatar'
import { Search } from 'lucide-react'
import type { User } from '../../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  onChatCreated: (chat: any) => void
}

export default function NewMessageModal({
  isOpen,
  onClose,
  onChatCreated,
}: Props) {
  const [search, setSearch] = useState('')
  const { users, createChat } = useChatStore()

  if (!isOpen) return null

  const filtered = users.filter(
    (u: User) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  )

  const handleSelect = async (userId: string) => {
    const chat = await createChat(userId)
    onChatCreated(chat)
    onClose()
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div className="absolute top-0 left-0 w-full bg-white rounded-lg shadow-lg border border-chat-border z-50">
        <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">New Message</h3>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-chat-border text-sm focus:outline-none focus:border-primary-500"
            autoFocus
          />
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {filtered.map((user) => (
          <button
            key={user.id}
            onClick={() => handleSelect(user.id)}
            className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition"
          >
            <Avatar
              src={user.avatar_url}
              name={user.full_name}
              size="md"
              isOnline={user.is_online}
            />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">
                {user.full_name}
              </p>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-4 text-sm text-gray-400">
            No users found
          </p>
        )}
      </div>
    </div>
    </>
  )
}
