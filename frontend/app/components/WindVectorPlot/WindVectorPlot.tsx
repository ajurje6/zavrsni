"use client"
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface WindVector {
  height: number;
  date: string;
  speed: number;
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
        const speedsByHeight: Record<number, number[]> = {};
        apiData.forEach(({ height, speed }) => {
          if (!speedsByHeight[height]) speedsByHeight[height] = [];
          speedsByHeight[height].push(speed);
        });

        const averagedData: WindVector[] = Object.entries(speedsByHeight).map(
          ([height, speeds]) => ({
            height: Number(height),
            date: selectedDate,
            speed: speeds.reduce((a, b) => a + b, 0) / speeds.length,
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

  const dateTimestamp = new Date(selectedDate).getTime();
  const exaggerationFactor = 7;
  const speedScale = 1_500_000;

  const baseX = data.map(() => dateTimestamp);
  const baseY = data.map((d) => d.height);
  const endX = data.map(
    (d) => dateTimestamp + d.speed * exaggerationFactor * speedScale
  );
  const endY = baseY;

  const traces = data.map((d, i) => ({
    x: [baseX[i], endX[i]],
    y: [baseY[i], endY[i]],
    mode: "lines+markers",
    type: "scatter",
    line: { color: "blue", width: 6 },
    marker: { size: 16, color: "red", symbol: "triangle-right" },
    name: `Height ${d.height}m`,
    hovertemplate: `Height: ${d.height} m<br>Avg Speed: ${d.speed.toFixed(
      2
    )} m/s<extra></extra>`,
  }));

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
          data={traces}
          layout={{
            title: {
              text: `Average Wind Speed by Height ${selectedDate}`,
              font: { size: 22 },
              x: 0.5,
              xanchor: "center",
            },
            xaxis: {
              title: "Date (X shows speed as offset)",
              type: "date",
              range: [dateTimestamp - 1e7, dateTimestamp + 15e7],
              tickvals: [dateTimestamp],
              ticktext: [selectedDate],
              showgrid: false,
              zeroline: false,
              fixedrange: true,
            },
            yaxis: {
              title: "Height (m)",
              range: [0, 500],
              autorange: false,
              zeroline: false,
            },
            margin: { t: 70, b: 60, l: 70, r: 40 },
            height: 850,
            showlegend: false,
          }}
          config={{ responsive: true, displayModeBar: false }}
        />
      </div>
    </div>
  );
};

export default WindVectorPlot;
