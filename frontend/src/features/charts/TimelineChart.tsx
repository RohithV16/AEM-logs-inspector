import { registerables, Chart } from 'chart.js';
import { Line } from 'react-chartjs-2';

Chart.register(...registerables);

interface TimelineChartProps {
  data: Record<string, number>;
}

export function TimelineChart({ data }: TimelineChartProps) {
  const labels = Object.keys(data).sort();
  const values = labels.map(l => data[l]);

  const chartData = {
    labels,
    datasets: [{
      label: 'Log Events',
      data: values,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: '#3b82f6',
      tension: 0.3,
      fill: true,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 }
      }
    }
  };

  return (
    <div className="chart-container" style={{ height: '300px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}