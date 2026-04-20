import { Bar } from 'react-chartjs-2';
import { registerables, Chart } from 'chart.js';

Chart.register(...registerables);

interface DistributionChartProps {
  label: string;
  data: Record<string, number>;
  color?: string;
}

export function DistributionChart({ label, data, color = '#6366f1' }: DistributionChartProps) {
  const sorted = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const chartData = {
    labels: sorted.map(([k]) => k),
    datasets: [{
      label,
      data: sorted.map(([, v]) => v),
      backgroundColor: color,
      borderRadius: 4,
    }],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { 
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' }
      },
      y: {
        grid: { display: false },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  return (
    <div className="chart-container" style={{ height: '300px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
