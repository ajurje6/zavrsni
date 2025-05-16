"use client";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { useEffect, useState } from 'react';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

interface SpeedHeightBarChartProps {
  data: any[];
}

const SpeedHeightBarChart = ({ data }: SpeedHeightBarChartProps) => {
  console.log("SpeedHeightBarChart received data:", data);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData(null);
      return;
    }

    const heights = [...new Set(data.map((entry: any) => entry.height))];

    const avgWindSpeeds = heights.map((height) => {
      const entriesForHeight = data.filter((entry: any) => entry.height === height);

      if (entriesForHeight.length === 0) return null;

      // Filter out invalid speed entries before averaging
      const validSpeeds = entriesForHeight
        .map(entry => entry.speed)
        .filter((speed: any) => typeof speed === 'number' && !isNaN(speed));

      if (validSpeeds.length === 0) return null;

      const totalSpeed = validSpeeds.reduce((sum: number, speed: number) => sum + speed, 0);
      const avg = totalSpeed / validSpeeds.length;

      return isNaN(avg) ? null : avg;
    });

    // Filter out heights and speeds where avg speed is null
    const filteredHeights = heights.filter((_, i) => avgWindSpeeds[i] !== null);
    const filteredSpeeds = avgWindSpeeds.filter((v): v is number => v !== null);

    if (filteredHeights.length === 0 || filteredSpeeds.length === 0) {
      setChartData(null);
      return;
    }

    setChartData({
      labels: filteredHeights.map(String),
      datasets: [
        {
          label: 'Average Wind Speed (m/s)',
          data: filteredSpeeds,
          backgroundColor: "red",
          borderColor: "red",
          borderWidth: 1,
        },
      ],
    });
  }, [data]);

  if (!chartData) return <p>No valid data available to display chart.</p>;

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
                size: 20,
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
                font:{
                  size:16,
                }
              },
            },
            y: {
              title: {
                display: true,
                text: 'Wind Speed (m/s)',
                font:{
                  size:16,
                }
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




