import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Theme } from '../types'

interface ThemeContextValue {
  preference: Theme
  effective: 'light' | 'dark'
  setPreference: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getEffective(preference: Theme): 'light' | 'dark' {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return preference
}

const STORAGE_KEY = 'aem_themePreference'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
    return 'system'
  })

  const effective = getEffective(preference)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, preference)
    document.documentElement.setAttribute('data-theme', effective)
  }, [preference, effective])

  useEffect(() => {
    if (preference !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [preference])

  return (
    <ThemeContext.Provider value={{ preference, effective, setPreference }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider')
  return ctx
}
