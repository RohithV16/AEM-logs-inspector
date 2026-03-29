import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { LogEvent, LogType, FilterOptions, TimelineData } from '../types'

export const useLogStore = defineStore('log', () => {
  // File State
  const filePath = ref('')
  const logType = ref<LogType>('error')
  
  // Analysis Results
  const timeline = ref<TimelineData>({})
  const filterOptions = reactive<FilterOptions>({
    packages: [],
    loggers: [],
    methods: [],
    statuses: [],
    pods: [],
    countries: [],
    pops: [],
    hosts: [],
    caches: []
  })
  const levelCounts = ref({ ALL: 0, ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 })
  
  // Filters
  const filters = reactive({
    search: '',
    from: '',
    to: '',
    regex: '',
    level: 'ALL',
    packages: [] as string[],
    loggers: [] as string[],
    thread: '',
    exception: '',
    category: '',
    method: '',
    httpStatus: '',
    minResponseTime: null as number | null,
    maxResponseTime: null as number | null,
    pod: '',
    cache: '',
    clientCountry: '',
    pop: '',
    host: '',
    minTtfb: null as number | null,
    maxTtfb: null as number | null
  })
  
  // Events
  const events = ref<LogEvent[]>([])
  const totalEvents = ref(0)
  const currentPage = ref(1)
  const perPage = ref(50)
  
  // UI State
  const loading = ref(false)
  const chartsVisible = ref(true)
  const error = ref<string | null>(null)

  // Actions
  function setLogType(type: LogType) {
    logType.value = type
    resetFilters()
  }

  function resetFilters() {
    filters.search = ''
    filters.from = ''
    filters.to = ''
    filters.regex = ''
    filters.level = 'ALL'
    filters.packages = []
    filters.loggers = []
    filters.thread = ''
    filters.exception = ''
    filters.category = ''
    filters.method = ''
    filters.httpStatus = ''
    filters.minResponseTime = null
    filters.maxResponseTime = null
    filters.pod = ''
    filters.cache = ''
    filters.clientCountry = ''
    filters.pop = ''
    filters.host = ''
    filters.minTtfb = null
    filters.maxTtfb = null
    currentPage.value = 1
  }

  function setEvents(newEvents: LogEvent[], total: number) {
    events.value = newEvents
    totalEvents.value = total
  }

  function setAnalysis(data: any) {
    timeline.value = data.timeline || {}
    Object.assign(filterOptions, data.filterOptions || {})
    levelCounts.value = data.summary?.levelCounts || { ALL: 0, ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 }
  }

  return {
    filePath, logType, timeline, filterOptions, levelCounts,
    filters, events, totalEvents, currentPage, perPage,
    loading, chartsVisible, error,
    setLogType, resetFilters, setEvents, setAnalysis
  }
})
