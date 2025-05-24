"use client";
import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useForm } from "react-hook-form";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const PressureLineChart = () => {
  const DEFAULT_DATE = "2025-01-04";

  const { register, handleSubmit } = useForm<{ startDate: string; endDate: string }>({
    defaultValues: { startDate: DEFAULT_DATE, endDate: DEFAULT_DATE },
  });

  interface DataEntry {
    date: string;
    min_pressure: number;
    avg_pressure: number;
    max_pressure: number;
  }

  const [data, setData] = useState<DataEntry[]>([]);
  const [filteredData, setFilteredData] = useState<DataEntry[]>([]);

  useEffect(() => {
    fetch("https://zavrsni-4knw.onrender.com/stacked-graph")
      .then((response) => response.json())
      .then((responseData) => {
        const fetched = responseData.data as DataEntry[];
        setData(fetched);
        setFilteredData(fetched.filter((entry) => entry.date === DEFAULT_DATE));
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const onSubmit = ({ startDate, endDate }: { startDate: string; endDate: string }) => {
    const filtered = data
      .filter((entry) => entry.date >= startDate && entry.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date));
    setFilteredData(filtered);
  };

  const chartData = {
    labels: filteredData.map((entry) => entry.date),
    datasets: [
      {
        label: "Min Pressure",
        data: filteredData.map((entry) => entry.min_pressure),
        borderColor: "red",
        backgroundColor: "red",
        tension: 0.3,
        fill: false,
        pointRadius: filteredData.length === 1 ? 6 : 3,
      },
      {
        label: "Avg Pressure",
        data: filteredData.map((entry) => entry.avg_pressure),
        borderColor: "blue",
        backgroundColor: "blue",
        tension: 0.3,
        fill: false,
        pointRadius: filteredData.length === 1 ? 6 : 3,
      },
      {
        label: "Max Pressure",
        data: filteredData.map((entry) => entry.max_pressure),
        borderColor: "green",
        backgroundColor: "green",
        tension: 0.3,
        fill: false,
        pointRadius: filteredData.length === 1 ? 6 : 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (tooltipItem: any) {
            return `${tooltipItem.dataset.label}: ${tooltipItem.raw.toFixed(2)} hPa`;
          },
        },
      },
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Date",
          font: { size: 16 },
        },
        ticks: {}, // Add an empty ticks object to allow spreading
      },
      y: {
        title: {
          display: true,
          text: "Pressure (hPa)",
          font: { size: 16 },
        },
        min: 1000,
        max: 1050,
        ticks: { stepSize: 10 },
      },
    },
  };

  const baseWidthPerDate = 100;
  const minChartWidth = 400;
  const dynamicChartWidth = Math.max(filteredData.length * baseWidthPerDate, minChartWidth);

  return (
    <div className="p-4 max-w-full mx-auto">
      <h2 className="text-xl font-bold mb-4">Pressure Line Chart</h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mb-4 flex flex-col sm:flex-row sm:items-end gap-4"
      >
        <div className="flex flex-col">
          <label className="text-sm font-medium">Start Date:</label>
          <input type="date" {...register("startDate")} className="border p-2 rounded-md" />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium">End Date:</label>
          <input type="date" {...register("endDate")} className="border p-2 rounded-md" />
        </div>
        <button
          type="submit"
          className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600"
        >
          Filter
        </button>
      </form>

      <div className="w-full flex justify-center">
        <div
          className={`h-[500px] min-w-[500px] mx-auto ${
            filteredData.length === 1 ? "flex flex-col items-center justify-center" : ""
          }`}
          style={{
            width:
              filteredData.length === 1
                ? "500px"
                : `${dynamicChartWidth}px`,
          }}
        >
          <Line
            data={chartData}
            options={{
              ...options,
              plugins: {
              ...options.plugins,
              legend: {
              ...options.plugins.legend,
              align: filteredData.length === 1 ? "center" : "start",  // ovo dodaj
              },
              },
            scales: {
              ...options.scales,
              x: {
              ...options.scales.x,
            ticks: {
              ...options.scales.x?.ticks,
              align: filteredData.length === 1 ? "center" : "start",
              callback: function (val: any, idx: number) {
            if (filteredData.length === 1) {
              return filteredData[0].date; 
            }
            return this.getLabelForValue(val); 
          },
        },
      },
    },
  }}
/>
          {filteredData.length === 1 && (
            <div className="mt-4 text-lg font-semibold text-center">
              {filteredData[0].date}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PressureLineChart;






