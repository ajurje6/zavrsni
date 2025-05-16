"use client";
import BarometerGraph from "./components/BarometerGraph/BarometerGraph";
import BarometerTable from "./components/BarometerTable/BarometerTable";
import Navbar from "./components/Navbar/Navbar";
import PressureHeatmap from "./components/PressureHeatmap/PressureHeatmap";
import StackedPressureChart from "./components/StackedPressureChart/StackedPressureChart";
export default function Home() {
    return (
        <main>
            <Navbar/>
            <BarometerGraph/>
            <StackedPressureChart/>
            <BarometerTable/>
            <PressureHeatmap/>
        </main>
    );
}







