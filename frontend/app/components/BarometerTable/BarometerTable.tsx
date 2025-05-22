"use client";
import { useState, useEffect } from "react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Image from "next/image";

// Interfaces
interface SummaryData {
  date: string;
  min_pressure: number;
  max_pressure: number;
  avg_pressure: number;
}

interface RawData {
  datetime: string;
  pressure: number;
}

export default function BarometerTable() {
  const [data, setData] = useState<SummaryData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [rawStartDate, setRawStartDate] = useState<string>("");
  const [rawEndDate, setRawEndDate] = useState<string>("");

  const pageSize = 10;

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("https://zavrsni-4knw.onrender.com/stacked-graph");
      const json = await res.json();
      setData(json.data);
    };

    fetchData();
  }, []);

  // Sort by date
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Filter by month
  const filteredData =
    selectedMonth !== null
      ? sortedData.filter(
          (entry) => new Date(entry.date).getMonth() === selectedMonth
        )
      : sortedData;

  const offset = (currentPage - 1) * pageSize;
  const currentPageData = filteredData.slice(offset, offset + pageSize);
  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handlePageClick = (page: number) => setCurrentPage(page);
  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(event.target.value ? Number(event.target.value) : null);
    setCurrentPage(1);
  };

  // Export Summary to CSV
  const exportToCSV = () => {
    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "barometer_summary.csv";
    a.click();
  };

  // Export Summary to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["Date", "Min Pressure (hPa)", "Max Pressure (hPa)", "Avg Pressure (hPa)"]],
      body: filteredData.map((entry) => [
        entry.date,
        entry.min_pressure.toFixed(2),
        entry.max_pressure.toFixed(2),
        entry.avg_pressure.toFixed(2),
      ]),
    });
    doc.save("barometer_summary.pdf");
  };

  // Export raw data CSV with date filtering
  const exportRawToCSV = async () => {
    try {
      const res = await fetch("https://zavrsni-4knw.onrender.com/data");
      const rawDataResponse = await res.json();
      let rawDataArray: RawData[] = rawDataResponse.data || [];

      if (rawStartDate) {
        const start = new Date(rawStartDate);
        rawDataArray = rawDataArray.filter((entry) => {
          const ts = new Date(entry.datetime);
          return ts >= start;
        });
      }
      if (rawEndDate) {
        const end = new Date(rawEndDate);
        rawDataArray = rawDataArray.filter((entry) => {
          const ts = new Date(entry.datetime);
          return ts <= end;
        });
      }

      const csv = Papa.unparse(rawDataArray);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "barometer_raw_data.csv";
      a.click();
    } catch (error) {
      console.error("Failed to export raw data CSV:", error);
    }
  };

  // Export raw data PDF with date filtering
  const exportRawToPDF = async () => {
    try {
      const res = await fetch("https://zavrsni-4knw.onrender.com/data");
      const rawDataResponse = await res.json();
      let rawDataArray: RawData[] = rawDataResponse.data || [];

      if (rawStartDate) {
        const start = new Date(rawStartDate);
        rawDataArray = rawDataArray.filter((entry) => {
          const ts = new Date(entry.datetime);
          return ts >= start;
        });
      }
      if (rawEndDate) {
        const end = new Date(rawEndDate);
        rawDataArray = rawDataArray.filter((entry) => {
          const ts = new Date(entry.datetime);
          return ts <= end;
        });
      }

      const doc = new jsPDF();
      autoTable(doc, {
        head: [["Datetime", "Pressure (hPa)"]],
        body: rawDataArray.map((entry) => [
          entry.datetime || "N/A",
          entry.pressure?.toFixed(2) ?? "N/A",
        ]),
        styles: { fontSize: 7 },
      });
      doc.save("barometer_raw_data.pdf");
    } catch (error) {
      console.error("Failed to export raw data PDF:", error);
    }
  };

  return (
    <div className="p-4">
      <div className="flex flex-col items-center mb-4">

        {/* Raw Data Export Date Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="startDate">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={rawStartDate}
              onChange={(e) => setRawStartDate(e.target.value)}
              className="p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="endDate">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={rawEndDate}
              onChange={(e) => setRawEndDate(e.target.value)}
              className="p-2 border rounded"
            />
          </div>
        </div>

        {/* Raw Data Export Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mb-4">
          <button
            onClick={exportRawToCSV}
            className="p-2 bg-blue-500 text-white rounded flex items-center hover:shadow-md hover:shadow-blue-400"
          >
            <Image
              src="/csv.svg"
              alt="CSV Icon"
              width={20}
              height={20}
              className="mr-2"
            />
            Export Minute Data For Selected Dates CSV
          </button>
          <button
            onClick={exportRawToPDF}
            className="p-2 bg-purple-500 text-white rounded flex items-center hover:shadow-md hover:shadow-purple-400"
          >
            <Image
              src="/pdf.svg"
              alt="PDF Icon"
              width={20}
              height={20}
              className="mr-2"
            />
            Export Minute Data For Selected Dates PDF
          </button>
        </div>

        {/* Table Selector Title */}
        <h2 className="text-xl font-bold mb-2">Barometer Summary Table</h2>

        <div className="mb-4">
          <select
            onChange={handleMonthChange}
            value={selectedMonth !== null ? selectedMonth : ""}
            className="p-2 border rounded"
          >
            <option value="">Select Month</option>
            {[
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ].map((month, index) => (
              <option key={index} value={index}>
                {month}
              </option>
            ))}
          </select>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mb-4">
          <button
            onClick={exportToCSV}
            className="p-2 bg-green-500 text-white rounded flex items-center hover:shadow-md hover:shadow-green-400"
          >
            <Image
              src="/csv.svg"
              alt="CSV Icon"
              width={20}
              height={20}
              className="mr-2"
            />
            Export Summary CSV
          </button>
          <button
            onClick={exportToPDF}
            className="p-2 bg-red-500 text-white rounded flex items-center hover:shadow-md hover:shadow-red-400"
          >
            <Image
              src="/pdf.svg"
              alt="PDF Icon"
              width={20}
              height={20}
              className="mr-2"
            />
            Export Summary PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto shadow-xs">
        <table className="w-full text-sm text-left text-white bg-gradient-to-b from-red-200 via-red-400 to-red-600 rounded-lg overflow-hidden">
          <thead className="text-xs text-white uppercase bg-red-400">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Min Pressure (hPa)</th>
              <th className="px-6 py-3">Max Pressure (hPa)</th>
              <th className="px-6 py-3">Avg Pressure (hPa)</th>
            </tr>
          </thead>
          <tbody>
            {currentPageData.map((entry) => (
              <tr
                key={entry.date}
                className="border-b border-red-400 hover:bg-red-600 transition"
              >
                <td className="px-6 py-4">{entry.date}</td>
                <td className="px-6 py-4">{entry.min_pressure.toFixed(2)}</td>
                <td className="px-6 py-4">{entry.max_pressure.toFixed(2)}</td>
                <td className="px-6 py-4">{entry.avg_pressure.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4 gap-3">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => handlePageClick(page)}
            className={`px-3 py-1 rounded ${
              page === currentPage
                ? "bg-red-400 text-white"
                : "bg-red-200 text-white hover:bg-red-600"
            }`}
          >
            {page}
          </button>
        ))}
      </div>
    </div>
  );
}


