<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown, ChevronUp, Copy, ExternalLink, Clock, Server, Globe } from 'lucide-vue-next'
import { LogEvent } from '../stores/logStore'
import { formatDate, highlightText } from '../utils/formatters'
import { useLogStore } from '../stores/logStore'

const props = defineProps<{
  event: LogEvent
}>()

const store = useLogStore()
const isExpanded = ref(false)

const getLevelColor = (level: string) => {
  switch (level) {
    case 'ERROR': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
    case 'WARN': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
    case 'INFO': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
    case 'DEBUG': return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
    default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800'
  }
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  // Toast would be handled here
}
</script>

<template>
  <div 
    class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md mb-3"
    :class="{ 'ring-2 ring-primary-500/20 border-primary-500/50': isExpanded }"
  >
    <div 
      @click="isExpanded = !isExpanded"
      class="p-4 cursor-pointer flex flex-col md:flex-row md:items-center gap-3"
    >
      <!-- Log Type Specific Header -->
      <template v-if="store.logType === 'error'">
        <span 
          class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider self-start"
          :class="getLevelColor(event.level)"
        >
          {{ event.level }}
        </span>
        <span class="text-xs font-mono text-gray-500 whitespace-nowrap">
          {{ formatDate(event.timestamp) }}
        </span>
        <span class="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
          {{ event.logger }}
        </span>
      </template>

      <template v-else-if="store.logType === 'request'">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary-100 text-primary-700">
          {{ event.method }}
        </span>
        <span 
          class="px-2 py-0.5 rounded text-[10px] font-bold"
          :class="parseInt(event.status || '0') >= 400 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'"
        >
          {{ event.status }}
        </span>
        <span class="text-xs font-mono text-gray-500">
          {{ event.responseTime }}ms
        </span>
      </template>

      <template v-else-if="store.logType === 'cdn'">
        <span 
          class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
          :class="event.cache === 'HIT' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
        >
          {{ event.cache }}
        </span>
        <span class="text-xs font-bold text-gray-700 dark:text-gray-300">
          {{ event.clientCountry }} / {{ event.pop }}
        </span>
      </template>

      <!-- Common Message PART -->
      <div 
        class="flex-1 text-sm text-gray-600 dark:text-gray-400 truncate font-mono"
        v-html="highlightText(event.message, store.filters.search)"
      ></div>

      <div class="ml-auto">
        <ChevronDown v-if="!isExpanded" class="w-4 h-4 text-gray-400" />
        <ChevronUp v-else class="w-4 h-4 text-primary-500" />
      </div>
    </div>

    <!-- Expanded Body -->
    <div v-if="isExpanded" class="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 animate-in slide-in-from-top-2 duration-200">
      <div class="py-4">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            Detailed view
          </h4>
          <button 
            @click="copyToClipboard(event.message + (event.exception || ''))"
            class="p-1 px-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <Copy class="w-3.5 h-3.5" />
            Copy full log
          </button>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap border border-gray-200 dark:border-gray-700 shadow-inner">
          <div v-html="highlightText(event.message, store.filters.search)"></div>
          <div v-if="event.exception" class="mt-4 text-red-500/90 whitespace-pre">
            {{ event.exception }}
          </div>
        </div>

        <!-- Metadata Grid -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div v-if="event.thread" class="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Thread</div>
            <div class="text-xs text-gray-700 dark:text-gray-300 font-mono truncate">{{ event.thread }}</div>
          </div>
          <div v-if="event.pod" class="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <Server class="w-3.5 h-3.5 text-gray-400" />
            <div>
              <div class="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Pod</div>
              <div class="text-xs text-gray-700 dark:text-gray-300 font-mono">{{ event.pod }}</div>
            </div>
          </div>
          <div v-if="event.host" class="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <Globe class="w-3.5 h-3.5 text-gray-400" />
            <div>
              <div class="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Host</div>
              <div class="text-xs text-gray-700 dark:text-gray-300 font-mono">{{ event.host }}</div>
            </div>
          </div>
          <div v-if="event.ttfb" class="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <Clock class="w-3.5 h-3.5 text-gray-400" />
            <div>
              <div class="text-[10px] text-gray-400 uppercase font-bold mb-0.5">TTFB</div>
              <div class="text-xs text-gray-700 dark:text-gray-300 font-mono">{{ event.ttfb }}ms</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
