"use client";

import dynamic from "next/dynamic";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useEffect, useState } from "react";

// Dynamic import with SSR disabled for Bar chart
const BarChart = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), {
  ssr: false,
});

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SpeedHeightBarChartProps {
  data: any[];
}

const SpeedHeightBarChart = ({ data }: SpeedHeightBarChartProps) => {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData(null);
      return;
    }

    // Get unique heights
    const heights = [...new Set(data.map((entry) => entry.height))];

    // Calculate average wind speeds per height
    const avgWindSpeeds = heights.map((height) => {
      const entriesForHeight = data.filter((entry) => entry.height === height);

      // Filter valid speeds only
      const validSpeeds = entriesForHeight
        .map((entry) => entry.speed)
        .filter((speed) => typeof speed === "number" && !isNaN(speed));

      if (validSpeeds.length === 0) return null;

      const totalSpeed = validSpeeds.reduce((sum, speed) => sum + speed, 0);
      const avg = totalSpeed / validSpeeds.length;
      return isNaN(avg) ? null : parseFloat(avg.toFixed(2));
    });

    // Filter out null values
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
          label: "Average Wind Speed (m/s)",
          data: filteredSpeeds,
          backgroundColor: "rgba(255, 0, 0, 0.6)",
          borderColor: "rgba(255, 0, 0, 1)",
          borderWidth: 1,
        },
      ],
    });
  }, [data]);

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "Average Wind Speed by Height",
        color: "black",
        font: {
          size: 20,
          weight: 700,
          family: "Arial",
        },
        align: "start" as const,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Height (m)",
          font: {
            size: 16,
          },
        },
      },
      y: {
        title: {
          display: true,
          text: "Wind Speed (m/s)",
          font: {
            size: 16,
          },
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Average Wind Speed by Height</h2>
      {chartData ? <BarChart data={chartData} options={options} /> : <p>No valid data available.</p>}
    </div>
  );
};

export default SpeedHeightBarChart;




