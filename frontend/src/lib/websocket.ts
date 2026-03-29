type MessageHandler = (data: any) => void

class WebSocketManager {
  private ws: WebSocket | null = null
  private handlers: Map<string, Set<MessageHandler>> = new Map()
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private token: string | null = null

  connect(token: string) {
    this.token = token
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
    this.ws = new WebSocket(`${WS_URL}/ws/${token}`)

    this.ws.onopen = () => {
      console.log('WebSocket connected')
    }

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      const handlers = this.handlers.get(data.type)
      if (handlers) {
        handlers.forEach((handler) => handler(data))
      }
      const allHandlers = this.handlers.get('*')
      if (allHandlers) {
        allHandlers.forEach((handler) => handler(data))
      }
    }

    this.ws.onclose = () => {
      this.reconnectTimeout = setTimeout(() => {
        if (this.token) this.connect(this.token)
      }, 3000)
    }

    this.ws.onerror = () => {}
  }

  disconnect() {
    this.token = null
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout)
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)
    return () => {
      this.handlers.get(type)?.delete(handler)
    }
  }

  off(type: string, handler: MessageHandler) {
    this.handlers.get(type)?.delete(handler)
  }
}

export const wsManager = new WebSocketManager()
