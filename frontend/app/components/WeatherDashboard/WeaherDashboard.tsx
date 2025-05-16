"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import WindSpeedGraph from "../WindSpeedGraph/WindSpeedGraph";
import WindDirectionGraph from "../WindDirectionGraph/WindDirectionGraph";
import SpeedHeightBarChart from "../SpeedHeightBarChart/SpeedHeightBarChart";

const WeatherDashboard = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // Format YYYY-MM-DD
  });

  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [noData, setNoData] = useState(false);

  const fetchData = async (date: string) => {
    setIsLoading(true);
    setNoData(false);

    try {
      const response = await axios.get(
        `https://zavrsni-4knw.onrender.com/sodar-data?date=${date}`
      );

      const data = response.data;

      // Filter out entries containing "*"
      const cleanedData = data.filter(
        (entry: any) => !Object.values(entry).includes("*")
      );

      if (cleanedData.length === 0) {
        setWeatherData([]);
        setNoData(true);
      } else {
        setWeatherData(cleanedData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setNoData(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);

  return (
    <div className="p-4 bg-white text-black rounded-lg">
      {/* Date Picker */}
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

      {/* Loading */}
      {isLoading && (
        <p className="text-center text-xl">
          Loading data for {selectedDate}...
        </p>
      )}

      {/* No Data */}
      {noData && !isLoading && (
        <p className="text-center">No data available for {selectedDate}.</p>
      )}

      {/* Graphs */}
      {!isLoading && weatherData.length > 0 && (
        <>
          <WindSpeedGraph data={weatherData} />
          <WindDirectionGraph data={weatherData} />
          <SpeedHeightBarChart data={weatherData} />
        </>
      )}
    </div>
  );
};

export default WeatherDashboard;
