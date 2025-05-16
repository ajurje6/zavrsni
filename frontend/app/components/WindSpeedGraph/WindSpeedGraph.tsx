"use client";

import dynamic from "next/dynamic";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useEffect, useState } from "react";

// Dynamic import to avoid SSR issues
const LineChart = dynamic(() => import("react-chartjs-2").then((mod) => mod.Line), {
  ssr: false,
});

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const WindSpeedGraph = ({ data }: { data: any }) => {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData(null);
      return;
    }
  
    const groupedData: Record<string, number[]> = {};
  
    data.forEach((entry: any) => {
      if (typeof entry.speed === "number" && !isNaN(entry.speed)) {
        if (!groupedData[entry.time]) {
          groupedData[entry.time] = [];
        }
        groupedData[entry.time].push(entry.speed);
      }
    });
  
    const averagedData = Object.entries(groupedData)
      .map(([time, speeds]) => {
        if (speeds.length === 0) return null;
        const avgSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
        return { time, avgSpeed: parseFloat(avgSpeed.toFixed(2)) };
      })
      .filter((entry): entry is { time: string; avgSpeed: number } => entry !== null);
  
    const validEntries = averagedData.filter(
      (entry) => typeof entry.avgSpeed === "number" && !isNaN(entry.avgSpeed)
    );
  
    if (validEntries.length === 0) {
      setChartData(null);
      return;
    }
  
    const labels = validEntries.map((entry) => entry.time);
    const avgSpeeds = validEntries.map((entry) => entry.avgSpeed);
  
    console.log("Labels:", labels);
    console.log("Average speeds:", avgSpeeds);
    console.log("Any invalid speeds?", avgSpeeds.some(s => typeof s !== "number" || isNaN(s)));
  
    setChartData({
      labels,
      datasets: [
        {
          label: "Average Wind Speed (m/s)",
          data: avgSpeeds,
          borderColor: "rgba(255, 0, 0, 1)",
          backgroundColor: "rgba(255, 0, 0, 0.2)",
          tension: 0.3,
          parsing: false,
        },
      ],
    });
  }, [data]);  

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Time",
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
      },
    },
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Wind Speed Over Time</h2>
      {chartData ? <LineChart data={chartData} options={options} /> : <p>No data available.</p>}
    </div>
  );
};

export default WindSpeedGraph;









