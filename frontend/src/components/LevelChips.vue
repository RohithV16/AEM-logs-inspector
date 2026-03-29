<script setup lang="ts">
import { useLogStore } from '../stores/logStore'
import { useApi } from '../composables/useApi'

const store = useLogStore()
const { fetchEvents } = useApi()

const levels = [
  { id: 'ALL', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  { id: 'ERROR', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { id: 'WARN', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { id: 'INFO', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { id: 'DEBUG', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' }
]

const selectLevel = (level: string) => {
  store.filters.level = level
  store.currentPage = 1
  fetchEvents()
}
</script>

<template>
  <div class="flex flex-wrap gap-2 mb-6">
    <button 
      v-for="level in levels" 
      :key="level.id"
      @click="selectLevel(level.id)"
      class="px-3 py-1.5 rounded-full text-xs font-bold transition-all border-2 flex items-center gap-2 shadow-sm"
      :class="[
        store.filters.level === level.id 
          ? 'border-primary-500 scale-105 z-10' 
          : 'border-transparent opacity-70 hover:opacity-100',
        level.color
      ]"
    >
      {{ level.id }}
      <span class="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
        {{ store.levelCounts[level.id as keyof typeof store.levelCounts] || 0 }}
      </span>
    </button>
  </div>
</template>
