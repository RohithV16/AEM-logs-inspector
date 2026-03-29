<script setup lang="ts">
import { useLogStore } from '../../stores/logStore'
import SearchableMultiSelect from './SearchableMultiSelect.vue'

const store = useLogStore()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="flex flex-col">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        HTTP Method
      </label>
      <select 
        v-model="store.filters.method"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-shadow"
      >
        <option value="">All Methods</option>
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="DELETE">DELETE</option>
        <option value="HEAD">HEAD</option>
      </select>
    </div>

    <div class="flex flex-col">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        HTTP Status
      </label>
      <input 
        v-model="store.filters.httpStatus"
        type="text" 
        placeholder="e.g. 200, 404, 5xx"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-shadow"
      />
    </div>

    <div class="flex flex-col">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        Response Time (ms)
      </label>
      <div class="flex items-center gap-2">
        <input 
          v-model.number="store.filters.minResponseTime"
          type="number" 
          placeholder="Min"
          class="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-shadow"
        />
        <span class="text-gray-400">-</span>
        <input 
          v-model.number="store.filters.maxResponseTime"
          type="number" 
          placeholder="Max"
          class="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-shadow"
        />
      </div>
    </div>

    <SearchableMultiSelect 
      v-model="store.filters.packages" 
      :options="store.filterOptions.pods"
      label="Pods"
      placeholder="Select pods..."
    />
  </div>
</template>
