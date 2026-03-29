<script setup lang="ts">
import { ref } from 'vue'
import { FileSearch, Upload, Play, Terminal } from 'lucide-vue-next'
import { useLogStore } from '../stores/logStore'
import { useApi } from '../composables/useApi'
import { useWebSocket } from '../composables/useWebSocket'

const store = useLogStore()
const { analyzeFile } = useApi()
const { progress, connect, startTail } = useWebSocket()

const localFilePath = ref('')
const selectedLogType = ref('error')

const handleAnalyze = async () => {
  if (!localFilePath.value) return
  const success = await analyzeFile(localFilePath.value, selectedLogType.value)
  if (success) {
    connect()
  }
}

const handleTail = () => {
  if (!localFilePath.value) return
  connect()
  setTimeout(() => {
    startTail(localFilePath.value)
  }, 500)
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
    <div class="flex flex-col md:flex-row gap-4 items-end">
      <div class="flex-1 w-full">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Log File Path
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FileSearch class="h-5 w-5 text-gray-400" />
          </div>
          <input 
            v-model="localFilePath"
            type="text" 
            placeholder="/path/to/your/aem/error.log"
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-shadow"
          />
        </div>
      </div>

      <div class="w-full md:w-48">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Log Type
        </label>
        <select 
          v-model="selectedLogType"
          class="block w-full py-2 pl-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-shadow"
        >
          <option value="error">Error Log</option>
          <option value="request">Request Log</option>
          <option value="cdn">CDN Log</option>
        </select>
      </div>

      <div class="flex gap-2 w-full md:w-auto">
        <button 
          @click="handleAnalyze"
          :disabled="store.loading || !localFilePath"
          class="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors gap-2"
        >
          <Play v-if="!store.loading" class="w-4 h-4" />
          <Upload v-else class="w-4 h-4 animate-spin" />
          {{ store.loading ? 'Analyzing...' : 'Analyze' }}
        </button>
        
        <button 
          @click="handleTail"
          :disabled="store.loading || !localFilePath"
          class="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors gap-2"
        >
          <Terminal class="w-4 h-4" />
          Tail
        </button>
      </div>
    </div>

    <!-- Progress Bar -->
    <div v-if="progress > 0 && progress < 100" class="mt-4">
      <div class="flex justify-between text-xs text-gray-500 mb-1">
        <span>Processing...</span>
        <span>{{ progress }}%</span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div class="bg-primary-600 h-1.5 rounded-full transition-all duration-300" :style="{ width: progress + '%' }"></div>
      </div>
    </div>
  </div>
</template>
