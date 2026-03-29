<script setup lang="ts">
import { FileText, Search } from 'lucide-vue-next'
</script>

<template>
  <div class="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div class="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-6">
      <FileText class="w-12 h-12 text-gray-400 dark:text-gray-500" />
    </div>
    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">No log file analyzed</h3>
    <p class="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
      Specify a file path above and click "Analyze" to begin your investigation. You can also "Tail" a file to see events in real-time.
    </p>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="text-primary-600 dark:text-primary-400 font-bold text-lg mb-1">Error Logs</div>
        <p class="text-xs text-gray-500 dark:text-gray-400">Deep dive into stack traces and exception patterns.</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="text-green-600 dark:text-green-400 font-bold text-lg mb-1">Request Logs</div>
        <p class="text-xs text-gray-500 dark:text-gray-400">Track HTTP methods, status codes, and response times.</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="text-orange-600 dark:text-orange-400 font-bold text-lg mb-1">CDN Logs</div>
        <p class="text-xs text-gray-500 dark:text-gray-400">Monitor edge performance and cache hit ratios.</p>
      </div>
    </div>
  </div>
</template>
