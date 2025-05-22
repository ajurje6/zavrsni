import Navbar from "../components/Navbar/Navbar";
import WeatherDashboard from "../components/WeatherDashboard/WeaherDashboard";
import WindSummaryTable from "../components/WindSummaryTable/WindSummaryTable";
import SodarPlot from "../components/SodarPlot/SodarPlot";
import WindSpeedGraph from "../components/WindSpeedGraph/WindSpeedGraph";
import WindDirectionGraph from "../components/WindDirectionGraph/WindDirectionGraph";
import WindVectorPlot from "../components/WindVectorPlot/WindVectorPlot";
export default function Sodar(){
    return(
        <main>
            <Navbar/>
            <SodarPlot/>
            <WindSpeedGraph/>
            <WindDirectionGraph/>
            <WindVectorPlot/>
            <WeatherDashboard/>
            <WindSummaryTable/>
        </main>
    );
}