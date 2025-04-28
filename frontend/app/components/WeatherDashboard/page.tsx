"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import WindSpeedGraph from "../WindSpeedGraph/page";
import WindDirectionGraph from "../WindDirectionGraph/page";
import SpeedHeightBarChart from "../SpeedHeightBarChart/page";
import WindSummaryTable from "../WindSummaryTable/page";

const WeatherDashboard = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // format "YYYY-MM-DD"
  });
  const [weatherData, setWeatherData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [noData, setNoData] = useState(false);

  const fetchData = async (date: string) => {
    setIsLoading(true);
    setNoData(false);
    try {
      const response = await axios.get("http://127.0.0.1:8000/sodar-data");
      const rawData = response.data;
  
      // Filter by selected date and remove entries with "*"
      const filteredData = rawData
        .filter((entry: any) => dayjs(entry.time).format("YYYY-MM-DD") === date)
        .filter((entry: any) => !Object.values(entry).includes("*")); // Remove any entry that contains "*"
  
      if (filteredData.length === 0) {
        setWeatherData(null);
        setNoData(true);
      } else {
        setWeatherData(filteredData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);  

  return (
    <div className="p-4 bg-white text-black rounded-lg">
  {/* Centered Title */}
  <h2 className="text-3xl font-semibold mb-4 text-center">SODAR Data Visualization</h2>

  {/* Centered Date Selector */}
  <div className="mb-4 flex justify-center">
    <label className="flex items-center">
      <span className="mr-2">Select Date:</span>
      <input 
        type="date" 
        value={selectedDate} 
        onChange={(e) => setSelectedDate(e.target.value)}
        className="p-2 border rounded text-center"
      />
    </label>
  </div>

  {/* Loading Message */}
  {isLoading && <p className="text-center text-xl">Loading data for {selectedDate}...</p>}

  {/* No Data Message */}
  {noData && !isLoading && <p className="text-center">No data available for {selectedDate}.</p>}

  {/* Display Graphs if Data Exists */}
  {!isLoading && weatherData && (
    <>
      <WindSpeedGraph data={weatherData} />
      <WindDirectionGraph data={weatherData} />
      <SpeedHeightBarChart data={weatherData}/>
    </>
  )}
</div>
  );
};
export default WeatherDashboard;