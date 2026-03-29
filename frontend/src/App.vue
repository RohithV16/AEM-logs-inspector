<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useLogStore } from './stores/logStore'
import AppHeader from './components/AppHeader.vue'
import FileUpload from './components/FileUpload.vue'
import FilterPanel from './components/FilterPanel/FilterPanel.vue'
import LevelChips from './components/LevelChips.vue'
import EventList from './components/EventList.vue'
import ChartsContainer from './components/ChartsContainer.vue'
import ExportBar from './components/ExportBar.vue'
import EmptyState from './components/EmptyState.vue'
import ToastContainer from './components/ToastContainer.vue'

const store = useLogStore()

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === '/' && (e.target as HTMLElement).tagName !== 'INPUT') {
    e.preventDefault()
    document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <AppHeader />
    
    <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <!-- Top Section: File Management -->
      <FileUpload />

      <template v-if="store.filePath">
        <!-- Dashboard Content -->
        <div class="space-y-6">
          <!-- Filter Area -->
          <FilterPanel />

          <!-- Analytics & Summaries -->
          <ChartsContainer />

          <!-- Primary Control Bar: Level Selection -->
          <div class="sticky top-16 z-30 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md py-4 -mx-4 px-4">
            <LevelChips />
          </div>

          <!-- Main Event List -->
          <EventList />
        </div>
      </template>

      <!-- Empty State -->
      <EmptyState v-else />
    </main>

    <!-- Overlays & Notifications -->
    <ExportBar />
    <ToastContainer />

    <!-- Help Tooltip -->
    <div class="fixed bottom-6 left-6 group pointer-events-none">
      <div class="bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
        Press <span class="bg-gray-600 dark:bg-gray-300 px-1.5 rounded text-[10px] mx-1">/</span> to search
      </div>
    </div>
  </div>
</template>

<style>
/* Global scrollbar improvements */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #8884;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #8886;
}

/* Base transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
