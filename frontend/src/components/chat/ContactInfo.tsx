import { useState } from 'react'
import Avatar from '../ui/Avatar'
import { X, Phone, Video, FileText, Link2, Image } from 'lucide-react'
import type { User } from '../../types'
import clsx from 'clsx'

interface Props {
  user: User
  isOpen: boolean
  onClose: () => void
}

// Sample data for tabs to match Figma designs
const sampleDocs = [
  { name: 'Document Requirement.pdf', pages: 10, size: '16 MB', type: 'pdf' },
  { name: 'User Flow.pdf', pages: 7, size: '32 MB', type: 'pdf' },
  { name: 'Existing App.fig', pages: null, size: '213 MB', type: 'fig' },
  { name: 'Product Illustrations.ai', pages: null, size: '72 MB', type: 'ai' },
  { name: 'Quotation-Hikariworks-May.pdf', pages: 2, size: '329 KB', type: 'pdf' },
]

const sampleLinks = [
  { url: 'https://basecamp.net/', desc: 'Discover thousands of premium UI kits, templates, and design resources tailored for designers, developers, and...' },
  { url: 'https://notion.com/', desc: 'A new tool that blends your everyday work apps into one. It\'s the all-in-one workspace for you and your team.' },
  { url: 'https://asana.com/', desc: 'Work anytime, anywhere with Asana. Keep remote and distributed teams, and your entire organization, focused...' },
  { url: 'https://trello.com/', desc: 'Make the impossible, possible with Trello. The ultimate teamwork project management tool. Start up board in se...' },
]

const sampleMediaMonths = [
  { month: 'May', count: 8 },
  { month: 'April', count: 6 },
  { month: 'March', count: 4 },
]

function getFileIcon(type: string) {
  const colors: Record<string, string> = {
    pdf: 'bg-red-50 text-red-500',
    fig: 'bg-purple-50 text-purple-500',
    ai: 'bg-orange-50 text-orange-500',
  }
  const labels: Record<string, string> = {
    pdf: 'PDF',
    fig: 'FIG',
    ai: 'AI',
  }
  return (
    <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0', colors[type] || 'bg-gray-50 text-gray-500')}>
      {labels[type] || type.toUpperCase()}
    </div>
  )
}

function getLinkFavicon(url: string) {
  const domain = new URL(url).hostname
  const colors: Record<string, string> = {
    'basecamp.net': 'bg-gray-900',
    'notion.com': 'bg-gray-100',
    'asana.com': 'bg-orange-500',
    'trello.com': 'bg-blue-500',
  }
  const letters: Record<string, string> = {
    'basecamp.net': '⚡',
    'notion.com': 'N',
    'asana.com': '⊕',
    'trello.com': '▐',
  }
  return (
    <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0', colors[domain] || 'bg-gray-500')}>
      {letters[domain] || domain[0].toUpperCase()}
    </div>
  )
}

export default function ContactInfo({ user, isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'Media' | 'Link' | 'Docs'>('Media')

  if (!isOpen) return null

  return (
    <div className="w-[320px] bg-white border-l border-chat-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-chat-border flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Contact Info</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Profile */}
      <div className="flex flex-col items-center py-6 px-4">
        <Avatar
          src={user.avatar_url}
          name={user.full_name}
          size="xl"
          isOnline={user.is_online}
        />
        <h4 className="mt-3 text-lg font-semibold text-gray-900">
          {user.full_name}
        </h4>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 px-4 mb-6">
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-chat-border rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
          <Phone className="w-4 h-4" />
          Audio
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-chat-border rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
          <Video className="w-4 h-4" />
          Video
        </button>
      </div>

      {/* Tabs */}
      <div className="flex-1 flex flex-col border-t border-chat-border min-h-0">
        <div className="flex border-b border-chat-border">
          {(['Media', 'Link', 'Docs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'flex-1 py-3 text-sm font-medium transition-colors',
                activeTab === tab
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'Media' && (
            <div className="p-3">
              {sampleMediaMonths.map((group) => (
                <div key={group.month} className="mb-4">
                  <p className="text-xs font-medium text-primary-500 mb-2">{group.month}</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {Array.from({ length: group.count }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-lg overflow-hidden"
                        style={{
                          background: `linear-gradient(${(i * 45 + group.month.length * 30) % 360}deg, 
                            hsl(${(i * 60 + group.month.length * 40) % 360}, 70%, 60%), 
                            hsl(${(i * 60 + group.month.length * 40 + 60) % 360}, 70%, 50%))`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Link' && (
            <div className="p-3">
              <p className="text-xs font-medium text-primary-500 mb-3">May</p>
              <div className="flex flex-col gap-3">
                {sampleLinks.map((link) => (
                  <div key={link.url} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                    {getLinkFavicon(link.url)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{link.url}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{link.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Docs' && (
            <div className="p-3">
              <p className="text-xs font-medium text-primary-500 mb-3">May</p>
              <div className="flex flex-col gap-2">
                {sampleDocs.map((doc) => (
                  <div key={doc.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                    {getFileIcon(doc.type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {doc.pages ? `${doc.pages} pages • ` : ''}{doc.size} • {doc.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
