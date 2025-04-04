"use client";
import { useState, useEffect } from "react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type SummaryEntry = {
  date: string;
  max_speed: number;
  min_speed: number;
  avg_speed: number;
  avg_direction: number;
};

const WindSummaryTable = () => {
  const [data, setData] = useState<SummaryEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("http://127.0.0.1:8000/sodar-summary");
      const json = await res.json();
      setData(json.data);  // Save all the data in the state
    };
    
    fetchData();
  }, []);

  // Sort data by date
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Pagination
  const offset = (currentPage - 1) * pageSize;
  const currentPageData = sortedData.slice(offset, offset + pageSize);
  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  const exportToCSV = () => {
    const csv = Papa.unparse(sortedData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sodar_summary.csv";
    a.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["Date", "Max Speed", "Min Speed", "Avg Speed", "Avg Direction"]],
      body: currentPageData.map((entry) => [
        entry.date,
        entry.max_speed.toFixed(2),
        entry.min_speed.toFixed(2),
        entry.avg_speed.toFixed(2),
        entry.avg_direction.toFixed(1),
      ]),
    });
    doc.save("sodar_summary.pdf");
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Wind Summary Table</h2>
        <div className="space-x-2">
          <button onClick={exportToCSV} className="bg-blue-600 text-white px-3 py-1 rounded">
            Export CSV
          </button>
          <button onClick={exportToPDF} className="bg-red-600 text-white px-3 py-1 rounded">
            Export PDF
          </button>
        </div>
      </div>

      <table className="w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">Date</th>
            <th className="border px-2 py-1">Max Speed</th>
            <th className="border px-2 py-1">Min Speed</th>
            <th className="border px-2 py-1">Avg Speed</th>
            <th className="border px-2 py-1">Avg Direction</th>
          </tr>
        </thead>
        <tbody>
          {currentPageData.map((entry) => (
            <tr key={entry.date}>
              <td className="border px-2 py-1">{entry.date}</td>
              <td className="border px-2 py-1">{entry.max_speed.toFixed(2)}</td>
              <td className="border px-2 py-1">{entry.min_speed.toFixed(2)}</td>
              <td className="border px-2 py-1">{entry.avg_speed.toFixed(2)}</td>
              <td className="border px-2 py-1">{entry.avg_direction.toFixed(1)}°</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-center space-x-2">
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-red-500 text-white" : ""}`}
            onClick={() => handlePageClick(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WindSummaryTable;



