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
import "chartjs-adapter-date-fns"; // Import date adapter
import BarometerTable from "../BarometerTable/page"; // Imports table component

// Dynamically import LineChart to prevent SSR issues
const LineChart = dynamic(() => import("react-chartjs-2").then((mod) => mod.Line), {
    ssr: false,
});

// ✅ Register required components
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
    const [minMaxAvgData, setMinMaxAvgData] = useState<any[]>([]); // Stores calculated summary data for multiple dates

    // Fetch data for the selected date
    useEffect(() => {
        setIsLoading(true);

        // Ensure the selected date is being correctly passed to the API
        axios.get(`http://127.0.0.1:8000/data?date=${selectedDate}`)
            .then((response) => {
                const data = response.data.data;

                // Check if there's data
                if (data.length === 0) {
                    console.error("No data received from API.");
                    setIsLoading(false);
                    return;
                }

                // Calculate min, max, and avg for the selected date
                const pressures = data.map((d: any) => d.pressure);
                const minPressure = Math.min(...pressures);
                const maxPressure = Math.max(...pressures);
                const avgPressure = pressures.reduce((acc: number, pressure: number) => acc + pressure, 0) / pressures.length;

                // Update the minMaxAvgData with the summary for the selected date
                setMinMaxAvgData((prevData) => [
                    ...prevData,
                    {
                        date: selectedDate,
                        min_pressure: minPressure,
                        max_pressure: maxPressure,
                        avg_pressure: avgPressure,
                    },
                ]);

                setChartData({
                    labels: data.map((d: any) => new Date(d.datetime).toISOString()),
                    datasets: [{
                        label: "Pressure (hPa)",
                        data: data.map((d: any) => d.pressure),
                        borderColor: "blue",
                        fill: false,
                    }],
                });

                setIsLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
                setIsLoading(false);
            });
    }, [selectedDate]); // Trigger on selectedDate change

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
                ticks: { color: "white", autoSkip: false, maxRotation: 0, minRotation: 0, maxTicksLimit: 1000 },
            },
            y: { type: "linear" as const, ticks: { color: "white", beginAtZero: false, autoSkip: true, maxTicksLimit: 10 } },
        },
        plugins: {
            legend: { position: "top" as const },
            zoom: {
                pan: { enabled: true, mode: "xy" as const },
                zoom: { enabled: true, mode: "xy" as const },
            },
        },
    };

    return (
        <div className="flex flex-col items-center p-6">
            <h1 className="text-3xl font-semibold mb-4">Barometer Data Visualization</h1>
            <label className="mb-4">
                <span className="mr-2">Select Date:</span>
                <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={handleDateChange}
                    className="p-2 border rounded"
                />
            </label>
            {isLoading ? (
                <p className="text-lg text-gray-600">Loading...</p>
            ) : chartData ? (
                <div className="w-full overflow-x-auto mt-5 max-w-full">
                    <div className="min-w-[2000px] h-[700px]">
                        <LineChart data={chartData} options={options} />
                    </div>
                </div>
            ) : (
                <p className="text-lg text-red-600">No data available for this date.</p>
            )}

            {/* Pass calculated summary data to the table component */}
            <BarometerTable data={minMaxAvgData} />
        </div>
    );
}



