<script setup lang="ts">
import { Download, FileJson, FileText, FileSpreadsheet } from 'lucide-vue-next'
import { useApi } from '../composables/useApi'
import { useLogStore } from '../stores/logStore'

const { exportData } = useApi()
const store = useLogStore()
</script>

<template>
  <div v-if="store.filePath" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
    <div class="bg-gray-900/90 dark:bg-white/90 backdrop-blur-md text-white dark:text-gray-900 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 border border-white/20 dark:border-black/10">
      <div class="flex items-center gap-2 pr-6 border-r border-white/10 dark:border-black/10">
        <Download class="w-5 h-5 text-primary-400 dark:text-primary-600" />
        <span class="text-sm font-bold uppercase tracking-wider">Export Results</span>
      </div>
      
      <div class="flex items-center gap-4">
        <button 
          @click="exportData('csv')"
          class="flex items-center gap-2 hover:text-primary-400 dark:hover:text-primary-600 transition-colors group"
        >
          <div class="p-1.5 rounded-lg bg-green-500/20 group-hover:bg-green-500/40 transition-colors">
            <FileSpreadsheet class="w-4 h-4 text-green-400 dark:text-green-600" />
          </div>
          <span class="text-xs font-bold">CSV</span>
        </button>

        <button 
          @click="exportData('json')"
          class="flex items-center gap-2 hover:text-primary-400 dark:hover:text-primary-600 transition-colors group"
        >
          <div class="p-1.5 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/40 transition-colors">
            <FileJson class="w-4 h-4 text-blue-400 dark:text-blue-600" />
          </div>
          <span class="text-xs font-bold">JSON</span>
        </button>

        <button 
          @click="exportData('pdf')"
          class="flex items-center gap-2 hover:text-primary-400 dark:hover:text-primary-600 transition-colors group"
        >
          <div class="p-1.5 rounded-lg bg-red-500/20 group-hover:bg-red-500/40 transition-colors">
            <FileText class="w-4 h-4 text-red-400 dark:text-red-600" />
          </div>
          <span class="text-xs font-bold">PDF</span>
        </button>
      </div>

      <div class="pl-6 border-l border-white/10 dark:border-black/10 text-[10px] font-mono opacity-50">
        {{ store.totalEvents }} total entries
      </div>
    </div>
  </div>
</template>
