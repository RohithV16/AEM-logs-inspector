<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Sun, Moon, Database } from 'lucide-vue-next'

const isDark = ref(false)

const toggleDarkMode = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
})
</script>

<template>
  <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-6 sticky top-0 z-50">
    <div class="flex items-center gap-3">
      <div class="bg-primary-600 p-2 rounded-lg">
        <Database class="text-white w-6 h-6" />
      </div>
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white leading-tight">AEM Log Inspector</h1>
        <p class="text-xs text-gray-500 dark:text-gray-400">Universal Log Analysis Suite</p>
      </div>
    </div>

    <div class="flex items-center gap-4">
      <button 
        @click="toggleDarkMode"
        class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <Sun v-if="isDark" class="w-5 h-5" />
        <Moon v-else class="w-5 h-5" />
      </button>
    </div>
  </header>
</template>
