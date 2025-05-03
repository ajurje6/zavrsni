import Navbar from "../components/Navbar/page";
import WeatherDashboard from "../components/WeatherDashboard/page";
import WindSummaryTable from "../components/WindSummaryTable/page";
import SodarPlot from "../components/SodarPlot/page";
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