"use client";
import BarometerGraph from "./components/BarometerGraph/page";
import Navbar from "./components/Navbar/page";
import StackedPressureChart from "./components/StackedPressureChart/page";
export default function Home() {
    return (
        <main>
            <Navbar/>
            <BarometerGraph/>
        </main>
    );
}







