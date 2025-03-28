import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import { useForm } from "react-hook-form";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const StackedPressureChart = () => {
  const DEFAULT_DATE = "2025-01-03"; // Default date

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
    fetch("http://127.0.0.1:8000/stacked-graph")
      .then((response) => response.json())
      .then((responseData) => {
        console.log("Fetched Data:", responseData);
        setData(responseData.data);

        // Automatically filter for default date
        const defaultFiltered = responseData.data.filter(
          (entry: DataEntry) => entry.date === DEFAULT_DATE
        );
        setFilteredData(defaultFiltered);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const onSubmit = ({ startDate, endDate }: { startDate: string; endDate: string }) => {
    if (!Array.isArray(data)) {
      console.error("Data is not an array:", data);
      return;
    }

    const filtered = data
      .filter((entry) => entry.date >= startDate && entry.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date)); // Ensures correct date order

    setFilteredData(filtered);
  };

  const chartData = {
    labels: filteredData.map((entry) => entry.date),
    datasets: [
      {
        label: "Min Pressure",
        data: filteredData.map((entry) => entry.min_pressure),
        backgroundColor: "red",
        borderColor: "red",
        borderWidth: 1,
        stack: "pressure",
      },
      {
        label: "Avg Pressure",
        data: filteredData.map((entry) => entry.avg_pressure),
        backgroundColor: "blue",
        borderColor: "blue",
        borderWidth: 1,
        stack: "pressure",
      },
      {
        label: "Max Pressure",
        data: filteredData.map((entry) => entry.max_pressure),
        backgroundColor: "green",
        borderColor: "green",
        borderWidth: 1,
        stack: "pressure",
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
            const datasetIndex = tooltipItem.datasetIndex;
            const index = tooltipItem.dataIndex;
            const entry = filteredData[index];
  
            if (datasetIndex === 0) return `Min: ${entry.min_pressure}`;
            if (datasetIndex === 1) return `Avg: ${entry.avg_pressure}`;
            if (datasetIndex === 2) return `Max: ${entry.max_pressure}`;
          },
        },
      },
    },
  };
  

  const baseWidthPerDate = 100; // Width per date in pixels
  const minChartWidth = 400; // Minimum width
  const dynamicChartWidth = Math.max(filteredData.length * baseWidthPerDate, minChartWidth);

  return (
    <div className="p-4 max-w-full mx-auto bg-white rounded-lg shadow-md">
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

      {/* Center the chart dynamically */}
      <div className="w-full flex justify-center">
        <div className="h-[500px] min-w-[500px] mx-auto" style={{ width: `${dynamicChartWidth}px` }}>
          <Bar data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default StackedPressureChart;





