import Navbar from "../components/Navbar/page";
import WeatherDashboard from "../components/WeatherDashboard/page";
import WindSummaryTable from "../components/WindSummaryTable/page";
export default function Sodar(){
    return(
        <main>
            <Navbar/>
            <WeatherDashboard/>
            <WindSummaryTable/>
        </main>
    );
}