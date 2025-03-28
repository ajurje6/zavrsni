import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { useEffect, useState } from 'react';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

interface SpeedHeightBarChartProps {
  data: any[];
}

const SpeedHeightBarChart = ({ data }: SpeedHeightBarChartProps) => {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    // Extract heights dynamically
    const heights = [...new Set(data.map((entry: any) => entry.height))]; // Get unique heights

    // Calculate average wind speed for each height
    const avgWindSpeeds = heights.map((height) => {
      const entriesForHeight = data.filter((entry: any) => entry.height === height); // All entries for the same height
      const totalSpeed = entriesForHeight.reduce((sum: number, entry: any) => sum + entry.speed, 0); // Sum of wind speeds
      return totalSpeed / entriesForHeight.length; // Average speed
    });

    // Prepare the chart data
    setChartData({
      labels: heights.map(String), // Heights as labels on the X-axis
      datasets: [
        {
          label: 'Average Wind Speed (m/s)',
          data: avgWindSpeeds,
          backgroundColor: "red",
          borderColor: "red",
          borderWidth: 1,
        },
      ],
    });
  }, [data]);

  if (!chartData) return null;

  return (
    <div className="chart-container">
      <Bar
        data={chartData}
        options={{
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Average Wind Speed by Height',
              color: 'black',
              font: {
                size: 18,
                weight: 'bold',
                family: 'Arial',
              },
              align: 'start',
            },
            tooltip: {
              mode: 'index',
              intersect: false,
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Height (m)',
              },
            },
            y: {
              title: {
                display: true,
                text: 'Wind Speed (m/s)',
              },
              beginAtZero: true,
            },
          },
        }}
      />
    </div>
  );
};

export default SpeedHeightBarChart;



