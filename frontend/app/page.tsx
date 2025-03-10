"use client"
import { use, useEffect, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
} from "chart.js";
import { format } from "date-fns"; // Import date-fns for formatting

// Registering the required chart.js components
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

// Define types for the data
interface BarometerData {
    datetime: string;
    pressure: number;
}

interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        borderColor: string;
        fill: boolean;
    }[];
}

export default function Home() {
    const [chartData, setChartData] = useState<ChartData | null>(null);

    useEffect(() => {
        axios.get<BarometerData[]>("http://127.0.0.1:8000/data")
            .then((response) => {
                const data = response.data;
                setChartData({
                    labels: data.map(d => format(new Date(d.datetime), "yyyy-MM-dd HH:mm")), // Formatting the datetime
                    datasets: [
                        {
                            label: "Pressure (hPa)",
                            data: data.map(d => d.pressure),
                            borderColor: "blue",
                            fill: false,
                        },
                    ],
                });
            })
            .catch(error => console.error("Error fetching data:", error));
    }, []);

    return (
        <div>
            <h1>Barometer Data Visualization</h1>
            {chartData ? <Line data={chartData} /> : <p>Loading...</p>}
        </div>
    );
}

