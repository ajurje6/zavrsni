"use client";
import { Line } from "react-chartjs-2";
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const WindSpeedGraph = ({ data }: { data: any }) => {
  const [chartData, setChartData] = useState<any>(null);
  console.log("ComponentName received data:", data);
  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData(null);
      return;
    }

    const groupedData: Record<string, number[]> = {};
    data.forEach((entry: any) => {
      if (!groupedData[entry.time]) {
        groupedData[entry.time] = [];
      }
      groupedData[entry.time].push(entry.speed);
    });

    const averagedData = Object.entries(groupedData).map(([time, speeds]) => {
      const avgSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
      return { time, avgSpeed: parseFloat(avgSpeed.toFixed(2)) };
    });

    const labels = averagedData.map((entry) => entry.time);
    const avgSpeeds = averagedData.map((entry) => entry.avgSpeed);

    setChartData({
      labels,
      datasets: [
        {
          label: "Average Wind Speed (m/s)",
          data: avgSpeeds,
          borderColor: "rgba(255, 0, 0, 1)",
          backgroundColor: "rgba(255, 0, 0, 0.2)",
          tension: 0.3,
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
      {chartData ? <Line data={chartData} options={options} /> : <p>No data available.</p>}
    </div>
  );
};

export default WindSpeedGraph;







