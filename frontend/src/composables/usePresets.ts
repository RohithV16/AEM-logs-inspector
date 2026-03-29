import { useLogStore } from '../stores/logStore'

export function usePresets() {
  const store = useLogStore()

  const savePreset = (name: string) => {
    const presets = JSON.parse(localStorage.getItem('logPresets') || '{}')
    presets[name] = {
      logType: store.logType,
      filters: store.filters
    }
    localStorage.setItem('logPresets', JSON.stringify(presets))
  }

  const loadPreset = (name: string) => {
    const presets = JSON.parse(localStorage.getItem('logPresets') || '{}')
    if (presets[name]) {
      const { logType, filters } = presets[name]
      store.setLogType(logType)
      store.filters = { ...store.filters, ...filters }
      return true
    }
    return false
  }

  const listPresets = () => {
    const presets = JSON.parse(localStorage.getItem('logPresets') || '{}')
    return Object.keys(presets)
  }

  return {
    savePreset,
    loadPreset,
    listPresets
  }
}
