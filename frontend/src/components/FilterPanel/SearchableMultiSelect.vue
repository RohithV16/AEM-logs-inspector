<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Check, ChevronDown, Search, X } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string[]
  options: string[]
  placeholder?: string
  label?: string
}>()

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const searchQuery = ref('')
const containerRef = ref<HTMLElement | null>(null)

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  return props.options.filter(opt => 
    opt.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const toggleOption = (option: string) => {
  const newValue = [...props.modelValue]
  const index = newValue.indexOf(option)
  if (index === -1) {
    newValue.push(option)
  } else {
    newValue.splice(index, 1)
  }
  emit('update:modelValue', newValue)
}

const handleClickOutside = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})

const removeTag = (option: string) => {
  const newValue = props.modelValue.filter(v => v !== option)
  emit('update:modelValue', newValue)
}
</script>

<template>
  <div class="relative" ref="containerRef">
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
      {{ label }}
    </label>
    
    <div 
      @click="isOpen = !isOpen"
      class="min-h-[42px] w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer flex flex-wrap gap-1.5 items-center hover:border-primary-500 transition-colors"
    >
      <div v-if="modelValue.length === 0" class="text-gray-400 text-sm">
        {{ placeholder || 'Select options...' }}
      </div>
      
      <div 
        v-for="val in modelValue" 
        :key="val"
        class="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1"
      >
        {{ val }}
        <X @click.stop="removeTag(val)" class="w-3 h-3 cursor-pointer hover:text-primary-800 dark:hover:text-primary-200" />
      </div>

      <div class="ml-auto">
        <ChevronDown class="w-4 h-4 text-gray-400 transform transition-transform" :class="{ 'rotate-180': isOpen }" />
      </div>
    </div>

    <!-- Dropdown -->
    <div 
      v-if="isOpen"
      class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200"
    >
      <div class="p-2 border-b border-gray-100 dark:border-gray-700">
        <div class="relative">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search..."
            class="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 outline-none"
            @click.stop
          />
        </div>
      </div>
      
      <div class="max-h-60 overflow-y-auto p-1">
        <div 
          v-for="opt in filteredOptions" 
          :key="opt"
          @click.stop="toggleOption(opt)"
          class="flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <span :class="{ 'font-semibold text-primary-600 dark:text-primary-400': modelValue.includes(opt) }">
            {{ opt }}
          </span>
          <Check v-if="modelValue.includes(opt)" class="w-4 h-4 text-primary-600 dark:text-primary-400" />
        </div>
        
        <div v-if="filteredOptions.length === 0" class="px-3 py-4 text-sm text-gray-500 text-center">
          No matches found
        </div>
      </div>
    </div>
  </div>
</template>
