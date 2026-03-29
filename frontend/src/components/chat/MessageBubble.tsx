import { format } from 'date-fns'
import { Check, CheckCheck } from 'lucide-react'
import clsx from 'clsx'
import type { Message } from '../../types'

interface Props {
  message: Message
  isMine: boolean
}

export default function MessageBubble({ message, isMine }: Props) {
  let time = ''
  try {
    if (message.created_at) {
      time = format(new Date(message.created_at), 'h:mm a')
    }
  } catch {
    time = ''
  }

  return (
    <div
      className={clsx('flex mb-3', isMine ? 'justify-end' : 'justify-start')}
    >
      <div className={clsx('max-w-[65%]', isMine ? 'text-right' : 'text-left')}>
        <div
          className={clsx(
            'inline-block px-3.5 py-2 rounded-2xl',
            isMine
              ? 'bg-chat-sent'
              : 'bg-white shadow-sm',
            message.message_type === 'ai' &&
              'bg-purple-50 border border-purple-100',
          )}
        >
          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words text-left">
            {message.content}
          </p>
        </div>
        <div
          className={clsx(
            'flex items-center gap-1 mt-0.5 px-1',
            isMine ? 'justify-end' : 'justify-start',
          )}
        >
          <span className="text-[11px] text-gray-400">{time}</span>
          {isMine && (
            <span className="text-primary-500">
              {message.is_read ? (
                <CheckCheck className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
