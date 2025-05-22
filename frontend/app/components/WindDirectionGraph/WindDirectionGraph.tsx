"use client";

import dynamic from "next/dynamic";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useEffect, useState } from "react";
import axios from "axios";

const LineChart = dynamic(() => import("react-chartjs-2").then((mod) => mod.Line), {
  ssr: false,
});

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const WindDirectionGraph = () => {
  const [chartData, setChartData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [selectedHeight, setSelectedHeight] = useState<number | null>(null);
  const [heights, setHeights] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`https://zavrsni-4knw.onrender.com/sodar-data?date=${selectedDate}`);
        const data = response.data;

        if (!data || data.length === 0) {
          setChartData(null);
          setHeights([]);
          return;
        }

        const uniqueHeights = Array.from(
          new Set<number>(data.map((entry: { height: number }) => Number(entry.height)))
        ).sort((a, b) => a - b);
        setHeights(uniqueHeights);

        if (selectedHeight === null && uniqueHeights.length > 0) {
          setSelectedHeight(uniqueHeights[0]);
        }

        if (selectedHeight !== null) {
          const filteredData = data.filter(
            (entry: any) =>
              entry.height === selectedHeight &&
              typeof entry.direction === "number" &&
              !isNaN(entry.direction) &&
              entry.direction !== 0 // remove 0 values
          );

          const grouped: Record<string, number[]> = {};
          filteredData.forEach((entry: { time: string; direction: number }) => {
            if (!grouped[entry.time]) grouped[entry.time] = [];
            grouped[entry.time].push(entry.direction);
          });

          const averagedData = Object.entries(grouped)
            .map(([time, directions]) => {
              if (directions.length === 0) return { time, avgDirection: null };
              const avg =
                directions.reduce((sum, dir) => sum + dir, 0) / directions.length;
              return { time, avgDirection: parseFloat(avg.toFixed(1)) };
            })
            .sort((a, b) => a.time.localeCompare(b.time));

          const times = averagedData.map((entry) => entry.time);
          const directions = averagedData.map((entry) =>
            entry.avgDirection !== null ? entry.avgDirection : null
          );

          setChartData({
            labels: times,
            datasets: [
              {
                label: `Average Wind Direction (°) at ${selectedHeight}m`,
                data: directions,
                borderColor: "red",
                backgroundColor: "rgba(255,0,0,0.1)",
                pointRadius: 0, // no circles
                tension: 0,
                spanGaps: false,
              },
            ],
          });
        }
      } catch (error) {
        console.error("Error fetching wind direction data:", error);
        setChartData(null);
        setHeights([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, selectedHeight]);

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw as number;
            return getCompassDirection(value);
          },
        },
      },
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: "Wind Direction (°)",
          font: {
            size: 16,
          },
        },
        min: 0,
        max: 360,
        ticks: {
          callback: (tickValue: string | number) =>
            typeof tickValue === "number" ? getCompassDirection(tickValue) : tickValue,
        },
      },
      x: {
        title: {
          display: true,
          text: "Time",
          font: {
            size: 16,
          },
        },
      },
    },
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Wind Direction Over Time</h2>

      {/* Controls */}
      <div className="mb-4 flex items-center">
        <label className="mr-4">
          <span className="mr-2">Select Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 border rounded"
          />
        </label>
        <label>
          <span className="mr-2">Select Height:</span>
          <select
            value={selectedHeight || ""}
            onChange={(e) => setSelectedHeight(Number(e.target.value))}
            className="p-2 border rounded"
          >
            {heights.map((h) => (
              <option key={h} value={h}>
                {h} m
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Chart */}
      {isLoading ? (
        <p>Loading data...</p>
      ) : chartData ? (
        <LineChart data={chartData} options={options} />
      ) : (
        <p>No data available.</p>
      )}
    </div>
  );
};

export default WindDirectionGraph;






