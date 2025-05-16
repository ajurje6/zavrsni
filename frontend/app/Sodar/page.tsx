import Navbar from "../components/Navbar/Navbar";
import WeatherDashboard from "../components/WeatherDashboard/WeaherDashboard";
import WindSummaryTable from "../components/WindSummaryTable/WindSummaryTable";
import SodarPlot from "../components/SodarPlot/SodarPlot";
export default function Sodar(){
    return(
        <main>
            <Navbar/>
            <SodarPlot/>
            <WeatherDashboard/>
            <WindSummaryTable/>
        </main>
    );
}