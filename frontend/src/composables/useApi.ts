import axios from 'axios'
import { useLogStore } from '../stores/logStore'
import { LogType } from '../types'

const api = axios.create({
  baseURL: '/api'
})

export function useApi() {
  const store = useLogStore()

  const analyzeFile = async (filePath: string, logType: LogType): Promise<boolean> => {
    store.loading = true
    store.error = null
    try {
      const { data } = await api.post('/analyze', { filePath, logType })
      if (data.success) {
        store.setAnalysis(data)
        store.filePath = filePath
        store.setLogType(logType)
        return true
      } else {
        store.error = data.error
        return false
      }
    } catch (err: any) {
      store.error = err.response?.data?.error || err.message
      return false
    } finally {
      store.loading = false
    }
  }

  const fetchEvents = async (): Promise<void> => {
    store.loading = true
    try {
      const { data } = await api.post('/raw-events', {
        filePath: store.filePath,
        logType: store.logType,
        filters: store.filters,
        page: store.currentPage,
        perPage: store.perPage
      })
      if (data.success) {
        store.setEvents(data.events, data.total)
      } else {
        store.error = data.error
      }
    } catch (err: any) {
      store.error = err.message
    } finally {
      store.loading = false
    }
  }

  const exportData = async (format: 'csv' | 'json' | 'pdf'): Promise<void> => {
    try {
      const { data } = await api.post(`/export/${format}`, {
        filePath: store.filePath,
        logType: store.logType,
        filters: store.filters
      }, { responseType: 'blob' })
      
      const url = window.URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `export.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      store.error = `Export failed: ${err.message}`
    }
  }

  return {
    analyzeFile,
    fetchEvents,
    exportData
  }
}
