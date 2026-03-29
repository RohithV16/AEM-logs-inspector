<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-vue-next'
import { useLogStore } from '../stores/logStore'

const store = useLogStore()
const toasts = ref<Array<{ id: number, type: 'success' | 'error' | 'info', message: string }>>([])
let nextId = 0

const addToast = (type: 'success' | 'error' | 'info', message: string) => {
  const id = nextId++
  toasts.value.push({ id, type, message })
  setTimeout(() => {
    removeToast(id)
  }, 5000)
}

const removeToast = (id: number) => {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

watch(() => store.error, (newError) => {
  if (newError) {
    addToast('error', newError)
  }
})
</script>

<template>
  <div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-md w-full pointer-events-none">
    <transition-group name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="pointer-events-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 p-4 flex items-start gap-3 transform transition-all duration-300"
        :class="{
          'border-red-500': toast.type === 'error',
          'border-green-500': toast.type === 'success',
          'border-blue-500': toast.type === 'info'
        }"
      >
        <div class="flex-shrink-0 mt-0.5">
          <AlertCircle v-if="toast.type === 'error'" class="w-5 h-5 text-red-500" />
          <CheckCircle v-else-if="toast.type === 'success'" class="w-5 h-5 text-green-500" />
          <Info v-else class="w-5 h-5 text-blue-500" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white leading-5">
            {{ toast.message }}
          </p>
        </div>
        <button 
          @click="removeToast(toast.id)"
          class="flex-shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
