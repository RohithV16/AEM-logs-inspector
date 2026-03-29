<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useLogStore } from '../../stores/logStore'

Chart.register(...registerables)

const store = useLogStore()
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const updateChart = () => {
  if (!chartCanvas.value) return
  if (chartInstance) chartInstance.destroy()

  const data = store.filterOptions.loggers.slice(0, 10)
  const counts = data.map(() => Math.floor(Math.random() * 100)) // Placeholder for real logger counts

  chartInstance = new Chart(chartCanvas.value, {
    type: 'doughnut',
    data: {
      labels: data.map(l => l.split('.').pop() || l),
      datasets: [{
        data: counts,
        backgroundColor: ['#0ea5e9', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4', '#84cc16', '#14b8a6']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 8, font: { size: 9 } } },
        title: { display: true, text: 'Top Loggers' }
      }
    }
  })
}

onMounted(updateChart)
watch(() => store.filterOptions.loggers, updateChart)
</script>

<template>
  <div class="h-64 bg-gray-50 dark:bg-gray-900/40 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>
