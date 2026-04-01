import { useState } from 'react'
import Avatar from '../ui/Avatar'
import { X, Phone, Video } from 'lucide-react'
import type { User } from '../../types'
import clsx from 'clsx'

interface Props {
  user: User
  isOpen: boolean
  onClose: () => void
}

export default function ContactInfo({ user, isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'Media' | 'Link' | 'Docs'>('Media')

  if (!isOpen) return null

  return (
    <div
      className="fixed top-3 right-3 w-[450px] h-[1000px] max-h-[calc(100vh-24px)] bg-white flex flex-col z-50 rounded-3xl p-6 gap-6"
      style={{ boxShadow: '0px 4px 32px rgba(0, 0, 0, 0.12)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-heading text-[20px] leading-7">Contact Info</h3>
        <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-[#596881] hover:text-heading">
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Profile */}
      <div className="flex flex-col items-center gap-4 shrink-0">
        <Avatar src={user.avatar_url} name={user.full_name} size="xl" isOnline={user.is_online} />
        <div className="flex flex-col items-center gap-1">
          <h4 className="text-base font-medium text-heading tracking-tight">{user.full_name}</h4>
          <p className="text-xs text-muted">{user.email}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 shrink-0">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-chat-border rounded-lg text-sm font-medium text-heading hover:bg-gray-50 transition h-8">
          <Phone className="w-[18px] h-[18px]" strokeWidth={1} />
          Audio
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-chat-border rounded-lg text-sm font-medium text-heading hover:bg-gray-50 transition h-8">
          <Video className="w-[18px] h-[18px]" strokeWidth={1} />
          Video
        </button>
      </div>

      {/* Container: switch group + content */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        {/* Switch group */}
        <div className="flex items-center bg-chat-bg rounded-xl p-0.5 shrink-0 w-fit">
          {(['Media', 'Link', 'Docs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'px-2.5 py-2 text-sm font-medium rounded-[10px] transition-all leading-5 tracking-tight',
                activeTab === tab
                  ? 'bg-white text-heading shadow-[0px_0px_16px_rgba(0,0,0,0.06)]'
                  : 'text-muted hover:text-body'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto rounded-b-xl">
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted">
              {activeTab === 'Media' && 'No shared media yet'}
              {activeTab === 'Link' && 'No shared links yet'}
              {activeTab === 'Docs' && 'No shared documents yet'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
