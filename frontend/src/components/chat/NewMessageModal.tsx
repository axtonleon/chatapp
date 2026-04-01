import { useState } from 'react'
import { useChatStore } from '../../stores/chatStore'
import Avatar from '../ui/Avatar'
import { Search } from 'lucide-react'
import type { User } from '../../types'
import clsx from 'clsx'

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
      <div className="fixed inset-0 z-40" onClick={onClose} />
      {/* Popup: 273px wide, 440px tall, positioned below the button */}
      <div
        className="absolute top-full right-0 mt-2 w-[273px] bg-white border border-chat-border rounded-2xl p-3 z-50 flex flex-col items-center"
        style={{ boxShadow: '0px 0px 24px rgba(0, 0, 0, 0.06)', maxHeight: '440px' }}
      >
        {/* Member list: gap 16px */}
        <div className="w-full flex flex-col gap-4">
          {/* Title */}
          <h3 className="text-base font-medium text-heading tracking-tight leading-6">New Message</h3>

          {/* Search: 32px height, border-radius 10px, border #F3F3EE */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#404040]" strokeWidth={1.05} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full h-8 pl-8 pr-2 rounded-[10px] border border-chat-bg text-xs text-muted placeholder:text-muted focus:outline-none focus:border-primary-500"
              autoFocus
            />
          </div>

          {/* List: gap 4px between members */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-1" style={{ maxHeight: '328px' }}>
            {filtered.map((user, i) => (
              <button
                key={user.id}
                onClick={() => handleSelect(user.id)}
                className={clsx(
                  'w-full px-2 py-1.5 flex items-center gap-2.5 rounded-lg transition',
                  i === 1 ? 'bg-chat-bg' : 'hover:bg-chat-bg',
                )}
              >
                <div className="w-8 h-8 shrink-0">
                  <Avatar
                    src={user.avatar_url}
                    name={user.full_name}
                    size="sm"
                    isOnline={false}
                  />
                </div>
                <p className="text-xs font-medium text-heading leading-4">
                  {user.full_name}
                </p>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center py-4 text-xs text-muted">
                No users found
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
