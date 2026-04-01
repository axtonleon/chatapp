import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { Check, CheckCheck, FileText, Download, Pencil, Trash2, Copy, Mic, Play, Pause } from 'lucide-react'
import clsx from 'clsx'
import { useChatStore } from '../../stores/chatStore'
import type { Message } from '../../types'

interface Props {
  message: Message
  isMine: boolean
  isFirst: boolean
  isLast: boolean
  highlight?: boolean
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function resolveFileUrl(url: string) {
  if (url.startsWith('/uploads/')) {
    return `${API_URL}${url}`
  }
  return url
}

function parseFileContent(content: string) {
  try {
    const data = JSON.parse(content)
    if (data.url && data.filename) {
      return { ...data, url: resolveFileUrl(data.url) }
    }
  } catch {}
  return null
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function VoiceNotePlayer({ url, contentType, isMine }: { url: string; contentType: string; isMine: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onLoad = () => setDuration(audio.duration)
    const onTime = () => {
      setCurrentTime(audio.currentTime)
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0)
    }
    const onEnd = () => { setIsPlaying(false); setProgress(0); setCurrentTime(0) }

    audio.addEventListener('loadedmetadata', onLoad)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.removeEventListener('loadedmetadata', onLoad)
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('ended', onEnd)
    }
  }, [])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) { audio.pause() } else { audio.play() }
    setIsPlaying(!isPlaying)
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audio.currentTime = pct * duration
  }

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return '0:00'
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
  }

  // Generate fake waveform bars
  const bars = 24
  const waveform = Array.from({ length: bars }, (_, i) => {
    const h = 0.3 + Math.abs(Math.sin(i * 0.8 + 2)) * 0.7
    return h
  })

  return (
    <div className="flex items-center gap-2.5 min-w-[200px]">
      <audio ref={audioRef} preload="metadata">
        <source src={url} type={contentType} />
      </audio>

      {/* Play/Pause button */}
      <button
        onClick={toggle}
        className={clsx(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition',
          isMine ? 'bg-primary-500 text-white' : 'bg-primary-100 text-primary-600',
        )}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" fill="currentColor" /> : <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />}
      </button>

      {/* Waveform + time */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-end gap-[2px] h-5 cursor-pointer" onClick={seek}>
          {waveform.map((h, i) => {
            const filled = progress > (i / bars) * 100
            return (
              <div
                key={i}
                className={clsx(
                  'w-[3px] rounded-full transition-colors',
                  filled
                    ? (isMine ? 'bg-primary-600' : 'bg-primary-500')
                    : (isMine ? 'bg-primary-300' : 'bg-gray-300'),
                )}
                style={{ height: `${h * 100}%` }}
              />
            )
          })}
        </div>
        <span className="text-[10px] text-muted leading-none">
          {isPlaying || currentTime > 0 ? fmt(currentTime) : fmt(duration)}
        </span>
      </div>

      {/* Mic icon */}
      <Mic className={clsx('w-3.5 h-3.5 shrink-0', isMine ? 'text-primary-600' : 'text-primary-500')} />
    </div>
  )
}

export default function MessageBubble({ message, isMine, isFirst, isLast, highlight }: Props) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const { deleteMessage, setEditingMessage } = useChatStore()

  let time = ''
  try {
    if (message.created_at) {
      time = format(new Date(message.created_at), 'h:mm a')
    }
  } catch {
    time = ''
  }

  const getBubbleRadius = () => {
    if (isMine) {
      if (isFirst && isLast) return 'rounded-xl rounded-br'
      if (isFirst) return 'rounded-xl rounded-br'
      if (isLast) return 'rounded-xl rounded-tr'
      return 'rounded-xl rounded-tr rounded-br'
    } else {
      if (isFirst && isLast) return 'rounded-xl rounded-bl'
      if (isFirst) return 'rounded-xl rounded-bl'
      if (isLast) return 'rounded-xl rounded-tl'
      return 'rounded-xl rounded-tl rounded-bl'
    }
  }

  const isFileMsg = message.message_type === 'file' || message.message_type === 'image'
  const isAudioMsg = message.message_type === 'file' && (() => {
    try { const d = JSON.parse(message.content); return d.content_type?.startsWith('audio/') } catch { return false }
  })()
  const fileData = (isFileMsg || isAudioMsg) ? parseFileContent(message.content) : null
  const isTextMsg = message.message_type === 'text' || message.message_type === 'ai'

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    const menuW = 160
    const menuH = 120
    const x = Math.min(e.clientX, window.innerWidth - menuW - 8)
    const y = Math.min(e.clientY, window.innerHeight - menuH - 8)
    setContextMenu({ x, y })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setContextMenu(null)
  }

  const handleEdit = () => {
    setEditingMessage(message)
    setContextMenu(null)
  }

  const handleDelete = async () => {
    await deleteMessage(message.id)
    setContextMenu(null)
  }

  const renderContent = () => {
    if (message.message_type === 'image' && fileData) {
      return (
        <img
          src={fileData.url}
          alt={fileData.filename}
          className="max-w-full rounded-lg cursor-pointer"
          style={{ maxHeight: '240px' }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(fileData.url, '_blank') }}
        />
      )
    }

    if (isAudioMsg && fileData) {
      return <VoiceNotePlayer url={fileData.url} contentType={fileData.content_type} isMine={isMine} />
    }

    if (message.message_type === 'file' && fileData) {
      return (
        <a
          href={fileData.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-3 no-underline"
        >
          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-primary-500" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-medium text-body truncate">{fileData.filename}</p>
            <p className="text-[11px] text-muted">{formatFileSize(fileData.size)}</p>
          </div>
          <Download className="w-4 h-4 text-muted shrink-0" />
        </a>
      )
    }

    return (
      <p className="text-xs text-body whitespace-pre-wrap break-words text-left">
        {message.content}
      </p>
    )
  }

  return (
    <div
      className={clsx(
        'flex',
        isMine ? 'justify-end' : 'justify-start',
        isLast ? 'mb-3' : 'mb-0.5',
      )}
    >
      <div className={clsx('max-w-[65%]', isMine ? 'text-right' : 'text-left')}>
        <div
          onContextMenu={handleContextMenu}
          className={clsx(
            'inline-block p-3 transition-all cursor-default',
            isMine ? 'bg-chat-sent' : 'bg-white',
            getBubbleRadius(),
            message.message_type === 'ai' && 'bg-purple-50 border border-purple-100',
            highlight && 'ring-2 ring-primary-500 ring-offset-1',
          )}
        >
          {renderContent()}
        </div>
        {isLast && (
          <div
            className={clsx(
              'flex items-center gap-1.5 mt-1 px-1',
              isMine ? 'justify-end' : 'justify-start',
            )}
          >
            <span className="text-xs text-muted">{time}</span>
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
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed bg-white rounded-xl border border-chat-border p-1.5 z-50 w-[160px] flex flex-col gap-0.5"
            style={{ top: contextMenu.y, left: contextMenu.x, boxShadow: '0px 0px 24px rgba(0,0,0,0.06)' }}
          >
            {isTextMsg && (
              <button onClick={handleCopy} className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-heading hover:bg-chat-hover rounded-lg flex items-center gap-2">
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
            )}
            {isMine && isTextMsg && (
              <button onClick={handleEdit} className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-heading hover:bg-chat-hover rounded-lg flex items-center gap-2">
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
            {isMine && (
              <button onClick={handleDelete} className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-destructive hover:bg-red-50 rounded-lg flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
