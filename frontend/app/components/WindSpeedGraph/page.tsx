"use client";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const WindSpeedGraph = () => {
  const [chartData, setChartData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState("2025-01-03"); // Default date
  const [isLoading, setIsLoading] = useState(false);
  const [noData, setNoData] = useState(false);

  const fetchData = async (date: string) => {
    setIsLoading(true); // Start loading
    setNoData(false); // Reset no data state
    try {
      const response = await axios.get("http://127.0.0.1:8000/sodar-data"); // Get all data
      const rawData = response.data;

      // Filter data by selected date
      const filteredData = rawData.filter((entry: any) => 
        dayjs(entry.time).format("YYYY-MM-DD") === date
      );

      if (filteredData.length === 0) {
        setChartData(null);
        setNoData(true); // No data available
      } else {
        // Sort data by time
        filteredData.sort((a: any, b: any) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf());

        // Group by time and average wind speed
        const groupedData: { [key: string]: number[] } = {};
        filteredData.forEach((entry: any) => {
          if (!groupedData[entry.time]) {
            groupedData[entry.time] = [];
          }
          groupedData[entry.time].push(entry.speed);
        });

        const labels = Object.keys(groupedData);
        const speeds = labels.map(time => {
          const avgSpeed = groupedData[time].reduce((a, b) => a + b, 0) / groupedData[time].length;
          return avgSpeed;
        });

        setChartData({
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
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]); // Fetch data when date changes

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div className="p-4 bg-white text-black rounded-lg">
      <h2 className="text-lg font-bold mb-2">Wind Speed Over Time</h2>
      
      {/* Date Input */}
      <label className="mb-4 flex items-center">
        <span className="mr-2">Select Date:</span>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={handleDateChange}
          className="p-2 border rounded"
        />
      </label>

      {/* Loading Message */}
      {isLoading && <p>Loading data for {selectedDate}...</p>}

      {/* No Data Message */}
      {noData && !isLoading && <p>No data available for {selectedDate}.</p>}

      {/* Chart */}
      {!isLoading && chartData && (
        <Line 
          data={chartData} 
          options={{
            responsive: true,
            scales: {
              x: { ticks: { color: "red" } }, 
              y: { ticks: { color: "red" } }  
            }
          }} 
        />
      )}
    </div>
  );
};

export default WindSpeedGraph;




