'use client';
import { useState, useEffect } from 'react';

export default function SodarPlot() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateImageUrl = (date: string) => {
    return `http://localhost:8000/sodar-plot?date=${date}`;
  };

  const fetchPlot = () => {
    if (!selectedDate) return;
    setLoading(true);
    const url = generateImageUrl(selectedDate);
    setImageUrl(url);
  };

  useEffect(() => {
    fetchPlot(); // Auto-fetch on first render
  }, []);

  return (
    <div className="flex flex-col gap-4 items-center p-4">
      <h2 className="text-3xl font-semibold mb-4 text-center">SODAR Data Visualization</h2>

      <div className="flex items-center gap-4 flex-wrap justify-center">
        <label className="flex items-center gap-2">
          <span>Select Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 border rounded text-center"
          />
        </label>

        <button
          onClick={fetchPlot}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Show Plot
        </button>
      </div>

      {loading && <p className=" mt-4 text-xl text-center">Loading plot...</p>}

      {imageUrl && (
        <div className="mt-6">
          <img
            src={imageUrl}
            alt="SODAR plot"
            className="max-w-full border"
            onLoad={() => setLoading(false)}
          />
        </div>
      )}
    </div>
  );
}



