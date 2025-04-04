"use client";
import { useState, useEffect } from "react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Image from "next/image";

// Interface for the summary data
interface SummaryData {
    date: string;
    min_pressure: number;
    max_pressure: number;
    avg_pressure: number;
}

export default function BarometerTable() {
    const [data, setData] = useState<SummaryData[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const pageSize = 10;

    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch("http://127.0.0.1:8000/stacked-graph");
            const json = await res.json();
            setData(json.data);
        };

        fetchData();
    }, []);

    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Filter data based on selected month
    const filteredData = selectedMonth !== null
        ? sortedData.filter((entry) => {
            const entryDate = new Date(entry.date);
            return entryDate.getMonth() === selectedMonth;
        })
        : sortedData;

    // Pagination
    const offset = (currentPage - 1) * pageSize;
    const currentPageData = filteredData.slice(offset, offset + pageSize);
    const totalPages = Math.ceil(filteredData.length / pageSize);

    const handlePageClick = (page: number) => {
        setCurrentPage(page);
    };

    const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedMonth(event.target.value ? Number(event.target.value) : null);
        setCurrentPage(1); // Reset to first page when month changes
    };

    // Export to CSV
    const exportToCSV = () => {
        const csv = Papa.unparse(filteredData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "barometer_summary.csv";
        a.click();
    };

    // Export to PDF
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

    return (
        <div className="p-4">
          {/* Content goes here */}
          <div className="flex flex-col items-center mb-4">
            <h2 className="text-xl font-bold mb-2">Barometer Summary Table</h2>
      
            {/* Dropdown for Month Selection */}
            <div className="mb-4">
              <select
                onChange={handleMonthChange}
                value={selectedMonth !== null ? selectedMonth : ""}
                className="p-2 border rounded"
              >
                <option value="">Select Month</option>
                {["January", "February", "March"].map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
      
            {/* Buttons for Export */}
            <div className="flex space-x-4 mb-4">
              <button
                onClick={exportToCSV}
                className="p-2 bg-green-500 text-white rounded flex items-center hover:shadow-md hover:shadow-green-400 transition-normal"
              >
                <Image src="/csv.svg" alt="CSV Icon" width={20} height={20} className="mr-2" />
                Export to CSV
              </button>
              <button
                onClick={exportToPDF}
                className="p-2 bg-red-500 text-white rounded flex items-center hover:shadow-md hover:shadow-red-400 transition-normal"
              >
                <Image src="/pdf.svg" alt="PDF Icon" width={20} height={20} className="mr-2" />
                Export to PDF
              </button>
            </div>
          </div>
      
          {/* Table */}
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
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
                    <td className="px-6 py-4 font-medium text-white">{entry.date}</td>
                    <td className="px-6 py-4">{entry.min_pressure}</td>
                    <td className="px-6 py-4">{entry.max_pressure}</td>
                    <td className="px-6 py-4">{entry.avg_pressure.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
      
            {/* Pagination */}
            <div className="mt-4 flex justify-center space-x-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={`px-3 py-1 border rounded ${
                    currentPage === i + 1
                      ? "bg-red-400 text-white"
                      : "bg-red-200 text-white hover:bg-red-600"
                  }`}
                  onClick={() => handlePageClick(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }      