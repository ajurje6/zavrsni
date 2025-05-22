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
import axios from "axios";

// Dynamic import to avoid SSR issues
const LineChart = dynamic(() => import("react-chartjs-2").then((mod) => mod.Line), {
  ssr: false,
});

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const WindSpeedGraph = () => {
  const [chartData, setChartData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // Format YYYY-MM-DD
  });
  const [selectedHeight, setSelectedHeight] = useState<number | null>(null);
  const [heights, setHeights] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

        // Extract unique heights
        const uniqueHeights = Array.from(
          new Set<number>(data.map((entry: { height: number }) => Number(entry.height)))
        ).sort((a, b) => a - b);
        setHeights(uniqueHeights);

        // If no height is selected, set the first height as default
        if (selectedHeight === null && uniqueHeights.length > 0) {
          setSelectedHeight(uniqueHeights[0]);
        }

        // Filter data for the selected height
        if (selectedHeight !== null) {
          const filteredData = data.filter(
            (entry: any) => entry.height === selectedHeight
          );

          const labels: string[] = [];
          const speeds: (number | null)[] = [];

          filteredData.forEach((entry: any) => {
            labels.push(entry.time);
            speeds.push(entry.speed > 0 ? entry.speed : null); // show line breaks for 0 values
          });

          setChartData({
            labels,
            datasets: [
              {
                label: `Wind Speed (m/s) at ${selectedHeight}m`,
                data: speeds,
                borderColor: "red",
                backgroundColor: "rgba(255, 0, 0, 0.1)",
                tension: 0,
                pointRadius: 0,
                spanGaps: false, // important: show line breaks where data is null
              },
            ],
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
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
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `Wind Speed: ${context.raw} m/s`,
        },
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

      {/* Date Picker */}
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

        {/* Height Selector */}
        <label>
          <span className="mr-2">Select Height:</span>
          <select
            value={selectedHeight || ""}
            onChange={(e) => setSelectedHeight(Number(e.target.value))}
            className="p-2 border rounded"
          >
            {heights.map((height) => (
              <option key={height} value={height}>
                {height} m
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Loading */}
      {isLoading && <p>Loading data...</p>}

      {/* Chart */}
      {chartData ? <LineChart data={chartData} options={options} /> : !isLoading && <p>No data available.</p>}
    </div>
  );
};

export default WindSpeedGraph;










