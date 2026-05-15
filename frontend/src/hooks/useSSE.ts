import { useEffect, useRef } from 'react'

export function useSSE(
  url: string | null,
  onMessage: (data: unknown) => void,
  onError?: () => void,
) {
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!url) return

    const es = new EventSource(url)
    esRef.current = es

    es.onmessage = (e) => {
      try {
        onMessage(JSON.parse(e.data))
      } catch {
        onMessage(e.data)
      }
    }

    es.onerror = () => {
      onError?.()
      es.close()
    }

    return () => {
      es.close()
      esRef.current = null
    }
  }, [url, onMessage, onError])

  return esRef
}
