import { useState, useRef, useEffect } from 'react'
import { Smile, Paperclip, Mic, SendHorizontal, X } from 'lucide-react'
import { wsManager } from '../../lib/websocket'
import { useChatStore } from '../../stores/chatStore'
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react'

interface Props {
  chatId: string
  onSend: (content: string) => void
  isAiChat?: boolean
}

export default function MessageInput({ chatId, onSend, isAiChat }: Props) {
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const { uploadFile, editingMessage, setEditingMessage, editMessage } = useChatStore()

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content)
      inputRef.current?.focus()
    }
  }, [editingMessage])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimer.current) clearInterval(recordingTimer.current)
      if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
        mediaRecorder.current.stop()
      }
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value)
    if (!isAiChat && !editingMessage) {
      wsManager.send({ type: 'typing', chat_id: chatId, is_typing: true })
      if (typingTimeout.current) clearTimeout(typingTimeout.current)
      typingTimeout.current = setTimeout(() => {
        wsManager.send({ type: 'typing', chat_id: chatId, is_typing: false })
      }, 2000)
    }
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setText((prev) => prev + emojiData.emoji)
    setShowEmoji(false)
    inputRef.current?.focus()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(chatId, file)
    e.target.value = ''
  }

  const cancelEdit = () => {
    setEditingMessage(null)
    setText('')
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunks.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        if (recordingTimer.current) clearInterval(recordingTimer.current)
        setRecordingTime(0)

        const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        await uploadFile(chatId, file)
      }

      mediaRecorder.current = recorder
      recorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      recordingTimer.current = setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    } catch {
      alert('Microphone access denied')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop()
    }
    setIsRecording(false)
  }

  const cancelRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.ondataavailable = null
      mediaRecorder.current.onstop = () => {
        mediaRecorder.current!.stream.getTracks().forEach((t) => t.stop())
      }
      mediaRecorder.current.stop()
    }
    if (recordingTimer.current) clearInterval(recordingTimer.current)
    setIsRecording(false)
    setRecordingTime(0)
    audioChunks.current = []
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    if (editingMessage) {
      await editMessage(editingMessage.id, trimmed)
      setText('')
    } else {
      onSend(trimmed)
      setText('')
    }
  }

  // Recording UI
  if (isRecording) {
    return (
      <div className="flex items-center gap-3">
        <button type="button" onClick={cancelRecording} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-destructive hover:bg-red-100 transition shrink-0">
          <X className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center gap-3 h-10 px-4 rounded-full bg-white border border-red-300">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs text-body font-medium">{formatTime(recordingTime)}</span>
          <span className="text-xs text-muted">Recording...</span>
        </div>
        <button type="button" onClick={stopRecording} className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600 transition shrink-0">
          <SendHorizontal className="w-4 h-4" strokeWidth={1.3} />
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1 relative">
      {editingMessage && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-primary-50 rounded-full text-xs text-primary-600">
          <span className="flex-1 truncate">Editing: {editingMessage.content}</span>
          <button type="button" onClick={cancelEdit} className="shrink-0 hover:text-primary-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.zip,audio/*" onChange={handleFileSelect} />

        {showEmoji && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowEmoji(false)} />
            <div className="absolute bottom-14 right-16 z-50">
              <EmojiPicker onEmojiClick={handleEmojiClick} width={320} height={400} />
            </div>
          </>
        )}

        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleChange}
            placeholder={editingMessage ? 'Edit message...' : 'Type any message...'}
            className="w-full h-10 pl-4 pr-1 rounded-full bg-white border border-chat-border text-xs text-body placeholder:text-[#8796AF] focus:outline-none focus:border-primary-500"
          />
        </div>

        {!editingMessage && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={startRecording} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
              <Mic className="w-3.5 h-3.5 text-[#262626]" strokeWidth={1.3} />
            </button>
            <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
              <Smile className="w-3.5 h-3.5 text-[#262626]" strokeWidth={1.3} />
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
              <Paperclip className="w-3.5 h-3.5 text-[#262626]" strokeWidth={1.3} />
            </button>
          </div>
        )}

        <button type="submit" className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600 transition shrink-0">
          <SendHorizontal className="w-4 h-4" strokeWidth={1.3} />
        </button>
      </div>
    </form>
  )
}
