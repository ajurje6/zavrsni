import React, { useState, useEffect } from 'react';
import ReactCalendarHeatmap from 'react-calendar-heatmap';
import { Tooltip } from 'react-tooltip';
import "../../globals.css"
const PressureHeatmap = () => {
  const [pressureData, setPressureData] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/stacked-graph')
      .then((response) => response.json())
      .then((data) => {
        setPressureData(data.data);
      })
      .catch((error) => {
        console.error('Error fetching pressure data:', error);
      });
  }, []);

  // Helper function to generate all dates between the start and end date
  const generateDatesInRange = (startDate: Date, endDate: Date) => {
    let currentDate = new Date(startDate);
    const dates = [];
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const heatmapData = pressureData.map((item) => ({
    date: item.date,
    count: item.avg_pressure,
  }));

  // Define the start and end dates
  const startDate = new Date('2024-12-28');
  const endDate = new Date('2025-03-31');

  // Generate all dates between the start and end date
  const allDates = generateDatesInRange(startDate, endDate);

  const completeHeatmapData = allDates.map((date) => {
    const existingData = heatmapData.find((item) => item.date === date);
    return {
      date,
      count: existingData ? existingData.count : 0,
    };
  });

  return (
    <div className="p-4 flex justify-center items-center min-h-screen">
      <div className="w-full max-w-7xl h-1/2">
        <h2 className="text-3xl font-semibold mb-2 text-center">Pressure Heatmap</h2>
        <div>
          <ReactCalendarHeatmap
            startDate={startDate}
            endDate={endDate}
            values={completeHeatmapData}
            showWeekdayLabels={true}
            horizontal={true}
            classForValue={(value: { date: string; count: number } | null) => {
              if (!value || value.count === 0) {
                return 'color-empty';
              }
              if (value.count < 1010) return 'color-red-1';
              if (value.count < 1015) return 'color-red-2';
              if (value.count < 1020) return 'color-red-3';
              if (value.count < 1025) return 'color-red-4';
              return 'color-red-5';
            }}
            tooltipDataAttrs={(value: { date: string; count: number } | null) => {
              if (!value || value.count == null) return {};
              return {
                'data-tooltip-id': 'tooltip',
                'data-tooltip-content': `Avg Pressure: ${value.count.toFixed(2)} hPa on ${value.date}`,
              };
            }}
            weekdayLabels={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
            monthLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
            className="h-auto pb-1 mb-1"
            vertical={false} // Remove vertical scrolling, keep horizontal layout
          />
        </div>

        <div className="flex justify-center mt-2">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-2 bg-red-100"></span>
            <span className="text-xs">Less</span>
            <span className="w-8 h-2 bg-red-300"></span>
            <span className="w-8 h-2 bg-red-500"></span>
            <span className="w-8 h-2 bg-red-700"></span>
            <span className="w-8 h-2 bg-red-900"></span>
            <span className="text-xs">More</span>
          </div>
        </div>

        <Tooltip id="tooltip" delayShow={300} />
      </div>

      <style jsx global>{`
        .react-calendar-heatmap text {
          font-size: 8px;
        }
        /* Red color scale (lighter to darker reds) */
        .color-empty { fill: #ebedf0; }
        .color-red-1 { fill: #ffcdd2; }
        .color-red-2 { fill: #ef9a9a; }
        .color-red-3 { fill: #e57373; }
        .color-red-4 { fill: #ef5350; }
        .color-red-5 { fill: #d32f2f; }
      `}</style>
    </div>
  );
};

export default PressureHeatmap;





