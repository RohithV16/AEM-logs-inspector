import { useEffect } from 'react'

interface KeyboardShortcutLayerProps {
  onSearchFocus: () => void
  onEscape: () => void
}

export function KeyboardShortcutLayer({ onSearchFocus, onEscape }: KeyboardShortcutLayerProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        onSearchFocus()
      }
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault()
        onSearchFocus()
      }
      if (e.key === 'Escape') {
        onEscape()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onSearchFocus, onEscape])

  return null
}
