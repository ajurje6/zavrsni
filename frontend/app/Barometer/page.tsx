import BarometerGraph from "../components/BarometerGraph/BarometerGraph";
import Navbar from "../components/Navbar/Navbar";
import BarometerTable from "../components/BarometerTable/BarometerTable";
import PressureLineChart from "../components/PressureLineChart/PressureLineChart";
export default function Barometer(){
    return(
        <main>
            <Navbar/>
            <BarometerGraph/>
            <PressureLineChart/>
            <BarometerTable/>
        </main>
    );
}