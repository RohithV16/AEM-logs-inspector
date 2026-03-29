<script setup lang="ts">
import { Filter, Calendar, Search, RefreshCw, Trash2, Save, FolderOpen } from 'lucide-vue-next'
import { useLogStore } from '../../stores/logStore'
import { useApi } from '../../composables/useApi'
import { usePresets } from '../../composables/usePresets'
import ErrorFilters from './ErrorFilters.vue'
import RequestFilters from './RequestFilters.vue'
import CDNFilters from './CDNFilters.vue'

const store = useLogStore()
const { fetchEvents } = useApi()
const { savePreset, listPresets, loadPreset } = usePresets()

const handleApplyFilters = () => {
  store.currentPage = 1
  fetchEvents()
}

const handleClearFilters = () => {
  store.resetFilters()
  fetchEvents()
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
    <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
      <div class="flex items-center gap-2">
        <Filter class="w-5 h-5 text-primary-600" />
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Active Filters</h2>
      </div>
      
      <div class="flex items-center gap-2">
        <button 
          @click="handleClearFilters"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Trash2 class="w-4 h-4" />
          Clear
        </button>
        <button 
          @click="handleApplyFilters"
          class="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-colors"
        >
          <RefreshCw class="w-4 h-4" />
          Apply Filters
        </button>
      </div>
    </div>

    <div class="p-6">
      <!-- Search & Date Range -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pb-8 border-b border-dashed border-gray-200 dark:border-gray-700">
        <div class="md:col-span-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Full Text Search
          </label>
          <div class="relative">
            <Search class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              v-model="store.filters.search"
              type="text" 
              placeholder="Search message, logger..."
              class="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-shadow"
            />
          </div>
        </div>

        <div class="md:col-span-2 grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              From
            </label>
            <div class="relative">
              <Calendar class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input 
                v-model="store.filters.from"
                type="datetime-local" 
                class="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-shadow"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              To
            </label>
            <div class="relative">
              <Calendar class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input 
                v-model="store.filters.to"
                type="datetime-local" 
                class="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-shadow"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Log Type Specific Filters -->
      <ErrorFilters v-if="store.logType === 'error'" />
      <RequestFilters v-else-if="store.logType === 'request'" />
      <CDNFilters v-else-if="store.logType === 'cdn'" />
    </div>

    <!-- Presets Footer -->
    <div class="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex items-center gap-4 text-xs font-medium text-gray-500">
      <div class="flex items-center gap-1.5">
        <FolderOpen class="w-4 h-4" />
        PRESETS:
      </div>
      <div class="flex flex-wrap gap-2">
        <button 
          v-for="name in listPresets()" 
          :key="name"
          @click="loadPreset(name)"
          class="px-2 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
        >
          {{ name }}
        </button>
        <button 
          @click="savePreset(prompt('Preset name:') || 'My Preset')"
          class="px-2 py-0.5 border border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center gap-1 hover:border-gray-400 transition-colors"
        >
          <Save class="w-3 h-3" />
          Save Current
        </button>
      </div>
    </div>
  </div>
</template>
