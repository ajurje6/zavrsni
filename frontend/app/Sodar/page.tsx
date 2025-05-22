import Navbar from "../components/Navbar/Navbar";
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
            <WindSummaryTable/>
        </main>
    );
}