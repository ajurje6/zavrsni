"use client";
import { PolarArea } from "react-chartjs-2";
import { Chart as ChartJS, RadialLinearScale, ArcElement, Tooltip, Legend } from "chart.js";
import { useEffect, useState } from "react";

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

const WindDirectionGraph = ({ data }: { data: any }) => {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData(null);
      return;
    }

    // Group wind direction into 8 main compass directions
    const directionBins: { [key: string]: number } = {
      "N (0°)": 0, "NE (45°)": 0, "E (90°)": 0, "SE (135°)": 0,
      "S (180°)": 0, "SW (225°)": 0, "W (270°)": 0, "NW (315°)": 0
    };

    data.forEach((entry: any) => {
      const dir = entry.direction;
      if (dir >= 337.5 || dir < 22.5) directionBins["N (0°)"]++;
      else if (dir >= 22.5 && dir < 67.5) directionBins["NE (45°)"]++;
      else if (dir >= 67.5 && dir < 112.5) directionBins["E (90°)"]++;
      else if (dir >= 112.5 && dir < 157.5) directionBins["SE (135°)"]++;
      else if (dir >= 157.5 && dir < 202.5) directionBins["S (180°)"]++;
      else if (dir >= 202.5 && dir < 247.5) directionBins["SW (225°)"]++;
      else if (dir >= 247.5 && dir < 292.5) directionBins["W (270°)"]++;
      else if (dir >= 292.5 && dir < 337.5) directionBins["NW (315°)"]++;
    });

    setChartData({
      labels: Object.keys(directionBins),
      datasets: [
        {
          label: "Wind Direction Frequency",
          data: Object.values(directionBins),
          backgroundColor: [
            "red", "orange",
            "yellow", "black",
            "blue", "pink",
            "purple", "green"
          ],
        },
      ],
    });
  }, [data]);

  return (
    <div className="p-4 bg-white text-black rounded-lg">
      <h2 className="text-lg font-bold mb-2">Wind Direction Over Time</h2>

      {chartData ? <PolarArea data={chartData} /> : <p>No data available.</p>}
    </div>
  );
};

export default WindDirectionGraph;

