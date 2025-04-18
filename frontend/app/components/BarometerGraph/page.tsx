"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    TimeScale,
    PointElement,
    Title,
    Tooltip,
    Legend
} from "chart.js";
import "chartjs-adapter-date-fns";

// Dynamically import LineChart to prevent SSR issues
const LineChart = dynamic(() => import("react-chartjs-2").then((mod) => mod.Line), {
    ssr: false,
});

// Registers required components
ChartJS.register(
    LineElement,
    CategoryScale,
    LinearScale,
    TimeScale,
    PointElement,
    Title,
    Tooltip,
    Legend
);

export default function BarometerGraph() {
    const [chartData, setChartData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedDate, setSelectedDate] = useState<string>("2025-01-03");
    const [minMaxAvgData, setMinMaxAvgData] = useState<any[]>([]);

    // Dynamically import zoom plugin to prevent SSR issues
    useEffect(() => {
        import("chartjs-plugin-zoom").then((zoomPlugin) => {
            ChartJS.register(zoomPlugin.default);
        }).catch((err) => console.error("Failed to load zoom plugin", err));
    }, []);

    useEffect(() => {
        setIsLoading(true);
    
        axios.get(`http://127.0.0.1:8000/data?date=${selectedDate}`)
            .then((response) => {
                const data = response.data.data;
    
                if (data.length === 0) {
                    console.error("No data received from API.");
                    setChartData(null); // Explicitly set chartData to null when no data
                    setIsLoading(false);
                    return;
                }
    
                const pressures = data.map((d: any) => d.pressure);
                const minPressure = Math.min(...pressures);
                const maxPressure = Math.max(...pressures);
                const avgPressure = (pressures.reduce((acc: number, pressure: number) => acc + pressure, 0) / pressures.length).toFixed(4);
                setMinMaxAvgData((prevData) => {
                    // Prevent duplicate dates in the table
                    if (!prevData.some(entry => entry.date === selectedDate)) {
                        return [
                            ...prevData,
                            {
                                date: selectedDate,
                                min_pressure: minPressure,
                                max_pressure: maxPressure,
                                avg_pressure: parseFloat(avgPressure), // Ensure it is a number
                            },
                        ];
                    }
                    return prevData;
                });
    
                setChartData({
                    labels: data.map((d: any) => new Date(d.datetime).toISOString()),
                    datasets: [{
                        label: "Pressure (hPa)",
                        data: data.map((d: any) => d.pressure),
                        backgroundcolor: "red",
                        borderColor: "red",
                        fill: true,
                    }],
                });
    
                setIsLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
                setChartData(null); // Explicitly set chartData to null on error
                setIsLoading(false);
            });
    }, [selectedDate]);
    

    const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(event.target.value);
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "time" as const,
            time: {
              unit: "minute" as const,
              tooltipFormat: "yyyy-MM-dd HH:mm",
              displayFormats: { minute: "yyyy-MM-dd HH:mm" },
            },
            ticks: {
              autoSkip: false,
              maxRotation: 0,
              minRotation: 0,
              maxTicksLimit: 1000,
            },
            title: {
              display: true,
              text: "Time",
              font: {
                size: 16,
              },
            },
          },
          y: {
            type: "linear" as const,
            ticks: {
              beginAtZero: false,
              autoSkip: true,
              maxTicksLimit: 10,
            },
            title: {
              display: true,
              text: "Pressure (hPa)",
              font: {
                size: 16,
              },
            },
          },
        },
        plugins: {
          legend: { position: "top" as const },
          zoom: {
            pan: {
              enabled: true,
              mode: "xy" as const,
            },
            zoom: {
              enabled: true,
              mode: "xy" as const,
              speed: 0.1,
              threshold: 10,
            },
          },
        },
      };
      

    return (
        <div className="flex flex-col items-center p-6">
            {/* Title for Barometer Data Visualization */}
            <h1 className="text-3xl font-semibold mb-4">Barometer Data Visualization</h1>

            {/* Date Picker */}
            <label className="mb-4">
                <span className="mr-2">Select Date:</span>
                <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={handleDateChange}
                    className="p-2 border rounded"
                />
            </label>

            {/* Title for Pressure Over Time */}
            <h2 className="text-xl font-bold mb-2 self-start">Pressure Over Time</h2> {/* Aligned to the left */}

            {/* Loading or Chart Display */}
            {isLoading ? (
                <p className="text-xl text-center">Loading data for {selectedDate}</p>
            ) : chartData ? (
                <div className="w-full overflow-x-auto mt-5 max-w-full">
                    <div className="min-w-[2000px] h-[700px]">
                        <LineChart data={chartData} options={options} />
                    </div>
                </div>
            ) : (
                <p className="text-lg text-red-600">No data available for this date.</p>
            )}
        </div>
    );
}






