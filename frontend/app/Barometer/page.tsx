import BarometerGraph from "../components/BarometerGraph/BarometerGraph";
import Navbar from "../components/Navbar/Navbar";
import StackedPressureChart from "../components/StackedPressureChart/StackedPressureChart";
import BarometerTable from "../components/BarometerTable/BarometerTable";
export default function Barometer(){
    return(
        <main>
            <Navbar/>
            <BarometerGraph/>
            <StackedPressureChart/>
            <BarometerTable/>
        </main>
    );
}