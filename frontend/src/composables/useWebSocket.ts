import { ref, onUnmounted } from 'vue'
import { useLogStore } from '../stores/logStore'
import { LogEvent } from '../types'

interface WSMessage {
  type: 'progress' | 'tail' | 'complete' | 'error'
  percentage?: number
  percent?: number
  event?: LogEvent
  error?: string
  total?: number
  events?: LogEvent[]
  [key: string]: any
}

export function useWebSocket() {
  const store = useLogStore()
  const socket = ref<WebSocket | null>(null)
  const progress = ref(0)
  const isTailMode = ref(false)

  const connect = (url: string = `ws://${window.location.host}/ws`) => {
    if (socket.value) socket.value.close()
    
    socket.value = new WebSocket(url)

    socket.value.onmessage = (event: MessageEvent) => {
      try {
        const data: WSMessage = JSON.parse(event.data)
        
        if (data.type === 'progress') {
          progress.value = data.percentage || data.percent || 0
        } else if (data.type === 'tail' && data.event) {
          store.events.unshift(data.event)
          if (store.events.length > store.perPage) {
            store.events.pop()
          }
        } else if (data.type === 'error') {
          store.error = data.error || 'Unknown WebSocket error'
        }
      } catch (e) {
        console.error('Failed to parse WS message', e)
      }
    }

    socket.value.onclose = () => {
      isTailMode.value = false
    }
    
    socket.value.onerror = (err) => {
      console.error('WS Error', err)
      store.error = 'WebSocket connection failed'
    }
  }

  const startTail = (filePath: string) => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify({ type: 'startTail', filePath }))
      isTailMode.value = true
    }
  }

  const stopTail = () => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify({ type: 'stopTail' }))
      isTailMode.value = false
    }
  }

  onUnmounted(() => {
    socket.value?.close()
  })

  return {
    progress,
    isTailMode,
    connect,
    startTail,
    stopTail
  }
}
