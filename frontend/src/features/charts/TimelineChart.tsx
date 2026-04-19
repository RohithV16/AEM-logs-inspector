import { useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { Line } from 'react-chartjs-2';

Chart.register(...registerables);

interface TimelineChartProps {
  data: { timestamp: string; count: number }[];
}

export function TimelineChart({ data }: TimelineChartProps) {
  const chartData = {
    labels: data.map(d => d.timestamp),
    datasets: [{
      label: 'Events',
      data: data.map(d => d.count),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
    }],
  };
  return <Line data={chartData} />;
}