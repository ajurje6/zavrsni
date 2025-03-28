"use client";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const WindSpeedGraph = ({ data }: { data: any }) => {
  if (!data) return null; // No data case

  // Process data for chart
  const labels = data.map((entry: any) => entry.time);
  const speeds = data.map((entry: any) => entry.speed);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Wind Speed (m/s)",
        data: speeds,
        borderColor: "rgba(255, 0, 0, 1)", // RED LINE
        backgroundColor: "rgba(255, 0, 0, 0.2)", // LIGHT RED FILL
        tension: 0.3,
      },
    ],
  };


  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Wind Speed Over Time</h2>
      <Line data={chartData}/>
    </div>
  );
};

export default WindSpeedGraph;





