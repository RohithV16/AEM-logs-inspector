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

  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  const data = hours.map(() => Math.floor(Math.random() * 50)) // Placeholder

  chartInstance = new Chart(chartCanvas.value, {
    type: 'bar',
    data: {
      labels: hours,
      datasets: [{
        label: 'Events per hour',
        data: data,
        backgroundColor: '#0ea5e988',
        borderColor: '#0ea5e9',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Hourly Activity' }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#8882' } },
        x: { grid: { display: false }, ticks: { font: { size: 9 } } }
      }
    }
  })
}

onMounted(updateChart)
watch(() => store.timeline, updateChart)
</script>

<template>
  <div class="h-64 bg-gray-50 dark:bg-gray-900/40 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>
