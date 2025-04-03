"use client";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";
import { useEffect, useState } from "react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const WindDirectionGraph = ({ data }: { data: any }) => {
  const [chartData, setChartData] = useState<any>(null);

  // Function to map degrees to compass directions
  const getCompassDirection = (deg: number) => {
    if (deg >= 337.5 || deg < 22.5) return `${deg.toFixed(1)}° N`;
    if (deg >= 22.5 && deg < 67.5) return `${deg.toFixed(1)}° NE`;
    if (deg >= 67.5 && deg < 112.5) return `${deg.toFixed(1)}° E`;
    if (deg >= 112.5 && deg < 157.5) return `${deg.toFixed(1)}° SE`;
    if (deg >= 157.5 && deg < 202.5) return `${deg.toFixed(1)}° S`;
    if (deg >= 202.5 && deg < 247.5) return `${deg.toFixed(1)}° SW`;
    if (deg >= 247.5 && deg < 292.5) return `${deg.toFixed(1)}° W`;
    if (deg >= 292.5 && deg < 337.5) return `${deg.toFixed(1)}° NW`;
    return `${deg.toFixed(1)}°`;
  };

  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData(null);
      return;
    }

    // Group wind directions by time and calculate the average per time period
    const groupedData: Record<string, number[]> = {};
    data.forEach((entry: any) => {
      if (!groupedData[entry.time]) {
        groupedData[entry.time] = [];
      }
      groupedData[entry.time].push(entry.direction);
    });

    const averagedData = Object.entries(groupedData).map(([time, directions]) => {
      const avgDirection = directions.reduce((sum, dir) => sum + dir, 0) / directions.length;
      return { time, avgDirection: parseFloat(avgDirection.toFixed(1)) };
    });

    // Extract unique times and averaged wind directions
    const times = averagedData.map((entry) => entry.time);
    const avgWindDirections = averagedData.map((entry) => entry.avgDirection);

    setChartData({
      labels: times,
      datasets: [
        {
          label: "Average Wind Direction (°)",
          data: avgWindDirections,
          borderColor: "red",
          backgroundColor: "rgba(255, 0, 0, 0.3)",
          pointRadius: 4,
          pointBackgroundColor: "red",
        },
      ],
    });
  }, [data]);

  return (
    <div className="p-4 bg-white text-black rounded-lg">
      <h2 className="text-lg font-bold mb-2">Wind Direction Over Time</h2>
      {chartData ? (
        <Line
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = context.raw as number;
                    return getCompassDirection(value);
                  },
                },
              },
            },
            scales: {
              y: {
                title: {
                  display: true,
                  text: "Wind Direction (°)",
                },
                ticks: {
                  callback: (value) => getCompassDirection(value as number), // Converts Y-axis labels
                },
              },
              x: {
                title: {
                  display: true,
                  text: "Time",
                },
              },
            },
          }}
        />
      ) : (
        <p>No data available.</p>
      )}
    </div>
  );
};

export default WindDirectionGraph;




