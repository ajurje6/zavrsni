"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface WindVector {
  height: number;
  date: string;
  speed: number;
  direction: number;
}

const WindVectorPlot = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [data, setData] = useState<WindVector[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`https://zavrsni-4knw.onrender.com/sodar-data?date=${selectedDate}`)
      .then((res) => res.json())
      .then((apiData: any[]) => {
        if (!Array.isArray(apiData)) {
          setData([]);
          setLoading(false);
          return;
        }
        const speedsByHeight: Record<number, { speed: number[]; direction: number[] }> = {};
        apiData.forEach(({ height, speed, direction }) => {
          if (!speedsByHeight[height]) speedsByHeight[height] = { speed: [], direction: [] };
          speedsByHeight[height].speed.push(speed);
          speedsByHeight[height].direction.push(direction);
        });

        const averagedData: WindVector[] = Object.entries(speedsByHeight).map(
          ([height, obj]) => ({
            height: Number(height),
            date: selectedDate,
            speed: obj.speed.reduce((a, b) => a + b, 0) / obj.speed.length,
            direction:
              obj.direction.reduce((a, b) => a + b, 0) / obj.direction.length,
          })
        );

        setData(averagedData);
        setLoading(false);
      })
      .catch(() => {
        setData([]);
        setLoading(false);
      });
  }, [selectedDate]);

  if (loading) return <p>Loading data...</p>;
  if (data.length === 0) return <p>No data for {selectedDate}</p>;

  const trace = {
    x: data.map((d) => d.speed),
    y: data.map((d) => d.height),
    mode: "lines+markers",
    type: "scatter",
    line: { color: "blue", width: 4 },
    marker: { size: 6, color: "red" },
    name: "Avg wind speed",
    hovertemplate: `Height: %{y} m<br>Avg Speed: %{x:.2f} m/s<extra></extra>`,
  };

  return (
    <div className="flex flex-col items-center w-full px-4 py-8">
      <label className="mb-6 text-md">
        Select date:
        <input
          type="date"
          className="ml-3 border border-gray-400 rounded px-3 py-2 shadow-sm"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </label>
      <div className="w-full flex justify-center">
        <Plot
          data={[trace]}
          layout={{
            title: {
              text: `Average Wind Speed by Height ${selectedDate}`,
              font: { size: 22 },
              x: 0.5,
              xanchor: "center",
            },
            xaxis: {
              title: "Avg Wind Speed (m/s)",
              showgrid: true,
              zeroline: false,
              fixedrange: true,
            },
            yaxis: {
              title: "Height (m)",
              range: [0, 520],
              autorange: false,
              zeroline: false,
            },
            margin: { t: 70, b: 60, l: 70, r: 40 },
            height: 950,
            showlegend: false,
          }}
          config={{ responsive: true, displayModeBar: false }}
        />
      </div>
    </div>
  );
};

export default WindVectorPlot;
