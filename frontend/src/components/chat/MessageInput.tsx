import { useState, useRef } from 'react'
import { Smile, Paperclip, Mic, Send } from 'lucide-react'
import { wsManager } from '../../lib/websocket'

interface Props {
  chatId: string
  onSend: (content: string) => void
  isAiChat?: boolean
}

export default function MessageInput({ chatId, onSend, isAiChat }: Props) {
  const [text, setText] = useState('')
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value)

    if (!isAiChat) {
      wsManager.send({
        type: 'typing',
        chat_id: chatId,
        is_typing: true,
      })

      if (typingTimeout.current) clearTimeout(typingTimeout.current)
      typingTimeout.current = setTimeout(() => {
        wsManager.send({
          type: 'typing',
          chat_id: chatId,
          is_typing: false,
        })
      }, 2000)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 py-3 bg-chat-bg border-t border-chat-border flex items-center gap-3"
    >
      {/* Input */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={text}
          onChange={handleChange}
          placeholder="Type any message..."
          className="w-full pl-4 pr-4 py-2.5 rounded-lg bg-white border border-chat-border text-sm focus:outline-none focus:border-primary-500"
        />
      </div>

      {/* Right-side action icons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
        >
          <Mic className="w-[18px] h-[18px]" />
        </button>
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
        >
          <Smile className="w-[18px] h-[18px]" />
        </button>
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
        >
          <Paperclip className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Send button */}
      <button
        type="submit"
        className="w-9 h-9 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600 transition shrink-0"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  )
}
