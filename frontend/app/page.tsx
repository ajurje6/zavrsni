"use client"; //komponenta se renderuje samo na klijentskoj strani

import { useEffect, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";

// Dinamički uvozimo Chart.js da izbjegnemo SSR greške
const LineChart = dynamic(() => import("react-chartjs-2").then((mod) => mod.Line), {
    ssr: false,  // Isključuje SSR za ovu komponentu
});

// Koristi useEffect da učita Chart.js unutar klijenta
const loadChartJs = async () => {
    const ChartJS = await import("chart.js");
    const ZoomPlugin = await import("chartjs-plugin-zoom");
    const { default: DateAdapter } = await import("chartjs-adapter-date-fns"); // Ensure default import

    console.log('Chartjs Adapter Date-Fns Version:', DateAdapter); // Log the version

    // Registering components and plugins
    ChartJS.registry.add(
        ChartJS.LineElement,
        ChartJS.CategoryScale,
        ChartJS.LinearScale,
        ChartJS.TimeScale,
        ChartJS.PointElement,
        ChartJS.Title,
        ChartJS.Tooltip,
        ChartJS.Legend,
        ZoomPlugin.default,  // Correct way to import ZoomPlugin
        DateAdapter // Correct way to import DateAdapter
    );
};

export default function Home() {
    const [chartData, setChartData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedDate, setSelectedDate] = useState<string>("2025-01-03");

    useEffect(() => {
        loadChartJs(); // Učitaj Chart.js i plugin samo na klijentu
    }, []);

    useEffect(() => {
        setIsLoading(true);

        axios.get(`http://127.0.0.1:8000/data?date=${selectedDate}`)
            .then((response) => {
                const data = response.data.data;
                if (data.length === 0) {
                    console.error("No data received from API.");
                    return;
                }

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
                ticks: { autoSkip: false, maxRotation: 0, minRotation: 0, maxTicksLimit: 1000 },
            },
            y: { type: "linear" as const, ticks: { beginAtZero: false, autoSkip: true, maxTicksLimit: 10 } },
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
                    max="2025-03-04"
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
        </div>
    );
}







