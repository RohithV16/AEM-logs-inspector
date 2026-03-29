<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight, Loader2, ListFilter } from 'lucide-vue-next'
import { useLogStore } from '../stores/logStore'
import { useApi } from '../composables/useApi'
import EventCard from './EventCard.vue'

const store = useLogStore()
const { fetchEvents } = useApi()

const totalPages = computed(() => Math.ceil(store.totalEvents / store.perPage))

const handlePrevPage = () => {
  if (store.currentPage > 1) {
    store.currentPage--
    fetchEvents()
  }
}

const handleNextPage = () => {
  if (store.currentPage < totalPages.value) {
    store.currentPage++
    fetchEvents()
  }
}

const startItem = computed(() => (store.currentPage - 1) * store.perPage + 1)
const endItem = computed(() => Math.min(store.currentPage * store.perPage, store.totalEvents))
</script>

<template>
  <div class="relative">
    <div v-if="store.loading" class="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex items-center gap-3">
        <Loader2 class="w-5 h-5 animate-spin text-primary-600" />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Refreshing events...</span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center justify-between mb-4 px-2">
      <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <ListFilter class="w-4 h-4" />
        <span>Showing <span class="font-bold text-gray-900 dark:text-white">{{ startItem }}-{{ endItem }}</span> of <span class="font-bold text-gray-900 dark:text-white">{{ store.totalEvents }}</span> events</span>
      </div>

      <!-- Pagination -->
      <div class="flex items-center gap-2">
        <button 
          @click="handlePrevPage"
          :disabled="store.currentPage === 1"
          class="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <span class="text-xs font-bold text-gray-700 dark:text-gray-300 min-w-[3rem] text-center">
          Page {{ store.currentPage }} / {{ totalPages }}
        </span>
        <button 
          @click="handleNextPage"
          :disabled="store.currentPage === totalPages"
          class="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- List -->
    <div v-if="store.events.length > 0" class="space-y-1">
      <EventCard 
        v-for="(event, idx) in store.events" 
        :key="`${event.timestamp}-${idx}`" 
        :event="event" 
      />
    </div>
    
    <div v-else-if="!store.loading" class="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center text-gray-500 flex flex-col items-center gap-4">
      <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-full">
        <ListFilter class="w-8 h-8 opacity-20" />
      </div>
      <p>No events found matching current criteria.</p>
    </div>

    <!-- Bottom Pagination -->
    <div v-if="totalPages > 1" class="mt-6 flex justify-center pb-20">
      <nav class="flex items-center gap-1">
        <button 
          v-for="p in Math.min(5, totalPages)" 
          :key="p"
          @click="store.currentPage = p; fetchEvents()"
          class="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all"
          :class="store.currentPage === p 
            ? 'bg-primary-600 text-white shadow-lg' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          {{ p }}
        </button>
        <span v-if="totalPages > 5" class="px-2 text-gray-400">...</span>
        <button 
          v-if="totalPages > 5"
          @click="store.currentPage = totalPages; fetchEvents()"
          class="w-11 h-10 rounded-lg flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {{ totalPages }}
        </button>
      </nav>
    </div>
  </div>
</template>
