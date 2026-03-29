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

  const labels = Object.keys(store.timeline)
  const datasets = [
    {
      label: 'ERROR',
      data: labels.map(l => store.timeline[l].ERROR || 0),
      borderColor: '#ef4444',
      backgroundColor: '#ef444422',
      fill: true,
      tension: 0.4
    },
    {
      label: 'WARN',
      data: labels.map(l => store.timeline[l].WARN || 0),
      borderColor: '#f59e0b',
      backgroundColor: '#f59e0b22',
      fill: true,
      tension: 0.4
    }
  ]

  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#8882' } },
        x: { grid: { display: false } }
      }
    }
  })
}

onMounted(updateChart)
watch(() => store.timeline, updateChart, { deep: true })
</script>

<template>
  <div class="h-64 relative bg-gray-50 dark:bg-gray-900/40 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>
