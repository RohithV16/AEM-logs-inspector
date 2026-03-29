<script setup lang="ts">
import { computed } from 'vue'
import { useLogStore } from '../../stores/logStore'
import SearchableMultiSelect from './SearchableMultiSelect.vue'

const store = useLogStore()

const loggersForPackage = computed(() => {
  if (store.filters.packages.length === 0) return store.filterOptions.loggers
  // In a real app, this would filter loggers based on selected packages
  // For this UI, we'll just show all available loggers
  return store.filterOptions.loggers
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <SearchableMultiSelect 
      v-model="store.filters.packages"
      :options="store.filterOptions.packages"
      label="Packages"
      placeholder="Select packages..."
    />
    
    <SearchableMultiSelect 
      v-model="store.filters.loggers"
      :options="loggersForPackage"
      label="Loggers"
      placeholder="Select loggers..."
    />

    <div class="flex flex-col">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        Thread
      </label>
      <input 
        v-model="store.filters.thread"
        type="text" 
        placeholder="Search thread..."
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-shadow"
      />
    </div>

    <div class="flex flex-col">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        Exception / Category
      </label>
      <input 
        v-model="store.filters.category"
        type="text" 
        placeholder="NullPointerException..."
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-shadow"
      />
    </div>
  </div>
</template>
