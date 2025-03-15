"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Dynamically import the BarChart to prevent SSR issues
const BarChart = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), {
  ssr: false,
});

// Registers required components
ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

interface PressureData {
  date: string;
  minPressure: number;
  maxPressure: number;
  avgPressure: number;
}

interface StackedPressureChartProps {
  data: PressureData[];
}

export default function StackedPressureChart({ data }: StackedPressureChartProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filteredData, setFilteredData] = useState<PressureData[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Get the first and last date from the data for default values
  useEffect(() => {
    if (data.length > 0) {
      const firstDate = data[0].date;
      const lastDate = data[data.length - 1].date;
      setStartDate(firstDate);
      setEndDate(lastDate);
      setFilteredData(data); // Initialize filteredData with all data
    }
  }, [data]);

  useEffect(() => {
    setIsLoading(true);

    // Filter data based on selected date range
    const filtered = data.filter((entry) => {
      const entryDate = new Date(entry.date); // Convert date string to Date object
      return (
        entryDate >= new Date(startDate) &&
        entryDate <= new Date(endDate)
      );
    });

    // Log the filtered data for debugging
    console.log("Filtered Data:", filtered);

    if (filtered.length === 0) {
      setIsLoading(false);
      return;
    }

    // Prepare chart data for the stacked bar chart
    const chartLabels = filtered.map((entry) => entry.date);
    const minData = filtered.map((entry) => entry.minPressure);
    const avgData = filtered.map((entry) => entry.avgPressure);
    const maxData = filtered.map((entry) => entry.maxPressure);

    // Log the chart data for debugging
    console.log("Chart Data:", { chartLabels, minData, avgData, maxData });

    setChartData({
      labels: chartLabels,
      datasets: [
        {
          label: "Min Pressure (hPa)",
          data: minData,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          stack: "stack1",
        },
        {
          label: "Avg Pressure (hPa)",
          data: avgData,
          backgroundColor: "rgba(153, 102, 255, 0.6)",
          stack: "stack1",
        },
        {
          label: "Max Pressure (hPa)",
          data: maxData,
          backgroundColor: "rgba(255, 99, 132, 0.6)",
          stack: "stack1",
        },
      ],
    });

    setIsLoading(false);
  }, [startDate, endDate, data]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Stacked Pressure Chart',
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
      },
    },
  };

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-3xl font-semibold mb-4">Pressure Data (Stacked Bar Chart)</h1>

      <div className="mb-4">
        <label className="mr-2">Start Date:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="p-2 border rounded"
        />
        <label className="ml-4 mr-2">End Date:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="p-2 border rounded"
        />
      </div>

      {isLoading ? (
        <p className="text-lg text-gray-600">Loading...</p>
      ) : chartData ? (
        <div className="w-full overflow-x-auto mt-5 max-w-full">
          <div className="min-w-[400px] h-[400px]">
            <BarChart data={chartData} options={options} />
          </div>
        </div>
      ) : (
        <p className="text-lg text-red-600">No data available for the selected range.</p>
      )}
    </div>
  );
}
