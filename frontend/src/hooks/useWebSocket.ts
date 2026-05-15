import { useEffect, useRef, useState } from 'react'

interface UseWebSocketOptions {
  url: string
  onMessage: (data: string) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: () => void
}

export function useWebSocket({ url, onMessage, onOpen, onClose, onError }: UseWebSocketOptions) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    let mounted = true

    function connect() {
      if (!mounted) return
      setStatus('connecting')
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mounted) { ws.close(); return }
        setStatus('connected')
        retriesRef.current = 0
        onOpen?.()
      }

      ws.onmessage = (e) => {
        onMessage(e.data)
      }

      ws.onclose = () => {
        if (!mounted) return
        setStatus('disconnected')
        onClose?.()
        scheduleReconnect()
      }

      ws.onerror = () => {
        onError?.()
      }
    }

    function scheduleReconnect() {
      const delay = Math.min(1000 * Math.pow(2, retriesRef.current), 30000)
      retriesRef.current++
      timerRef.current = window.setTimeout(connect, delay)
    }

    connect()

    return () => {
      mounted = false
      if (timerRef.current) clearTimeout(timerRef.current)
      wsRef.current?.close()
    }
  }, [url, onMessage, onOpen, onClose, onError])

  return { status, ws: wsRef }
}
