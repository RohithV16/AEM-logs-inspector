<script setup lang="ts">
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { useLogStore } from '../stores/logStore'
import TimelineChart from './charts/TimelineChart.vue'
import LoggerChart from './charts/LoggerChart.vue'
import HeatmapChart from './charts/HeatmapChart.vue'

const store = useLogStore()
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
    <div 
      @click="store.chartsVisible = !store.chartsVisible"
      class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
    >
      <div class="flex items-center gap-2">
        <BarChart3 class="w-5 h-5 text-primary-600" />
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Analytics Overview</h2>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs font-medium text-gray-400 uppercase tracking-widest px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded">
          Log Type: {{ store.logType }}
        </span>
        <div class="text-gray-400">
          <ChevronDown v-if="!store.chartsVisible" class="w-5 h-5" />
          <ChevronUp v-else class="w-5 h-5" />
        </div>
      </div>
    </div>

    <div v-if="store.chartsVisible" class="p-6 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-2 duration-300">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="lg:col-span-2">
          <TimelineChart />
        </div>
        <div>
          <LoggerChart />
        </div>
        <div>
          <HeatmapChart />
        </div>
      </div>
    </div>
  </div>
</template>
