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

    // Extract unique heights
    const heights = [...new Set(data.map((entry: any) => entry.height))];

    // Calculate average wind speed for each height, skipping invalid values
    const avgWindSpeeds = heights.map((height) => {
      const entriesForHeight = data.filter((entry: any) => entry.height === height);

      if (entriesForHeight.length === 0) return null;

      const totalSpeed = entriesForHeight.reduce((sum: number, entry: any) => {
        // Only add speed if it's a valid number
        return sum + (typeof entry.speed === "number" && !isNaN(entry.speed) ? entry.speed : 0);
      }, 0);

      const avg = totalSpeed / entriesForHeight.length;
      return isNaN(avg) ? null : avg;
    });

    // Filter out null values and keep heights aligned with speeds
    const filteredHeights = heights.filter((_, i) => avgWindSpeeds[i] !== null);
    const filteredSpeeds = avgWindSpeeds.filter((v): v is number => v !== null);

    if (filteredHeights.length === 0 || filteredSpeeds.length === 0) {
      setChartData(null);
      return;
    }

    // Set prepared chart data
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



