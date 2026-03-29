<script setup lang="ts">
import { useLogStore } from '../../stores/logStore'
import SearchableMultiSelect from './SearchableMultiSelect.vue'

const store = useLogStore()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="flex flex-col">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        Cache Status
      </label>
      <select 
        v-model="store.filters.cache"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-shadow"
      >
        <option value="">All</option>
        <option value="HIT">HIT</option>
        <option value="MISS">MISS</option>
        <option value="PASS">PASS</option>
      </select>
    </div>

    <SearchableMultiSelect 
      v-model="store.filters.packages" 
      :options="store.filterOptions.countries"
      label="Country"
      placeholder="Select countries..."
    />

    <SearchableMultiSelect 
      v-model="store.filters.loggers" 
      :options="store.filterOptions.pops"
      label="POP"
      placeholder="Select POPs..."
    />

    <div class="flex flex-col">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        TTFB (ms)
      </label>
      <div class="flex items-center gap-2">
        <input 
          v-model.number="store.filters.minTtfb"
          type="number" 
          placeholder="Min"
          class="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-shadow"
        />
        <span class="text-gray-400">-</span>
        <input 
          v-model.number="store.filters.maxTtfb"
          type="number" 
          placeholder="Max"
          class="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-shadow"
        />
      </div>
    </div>
  </div>
</template>
