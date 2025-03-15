"use client"; // Ensures this runs only on the client

import { useState, useEffect } from "react";
import Papa from "papaparse";
import { jsPDF } from "jspdf";
import Image from "next/image";
import autoTable from "jspdf-autotable";

interface SummaryData {
    date: string;
    min_pressure: number;
    max_pressure: number;
    avg_pressure: number;
}

interface BarometerTableProps {
    data: SummaryData[];
    setData: React.Dispatch<React.SetStateAction<SummaryData[]>>;
}

export default function BarometerTable({ data, setData }: BarometerTableProps) {
    const [mounted, setMounted] = useState(false);
    const [clientData, setClientData] = useState<SummaryData[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 5;

    useEffect(() => {
        setMounted(true); // Ensures the component is mounted before rendering data
        setClientData(data); // Only update data on the client side
    }, [data]);

    // Prevent SSR mismatch by rendering a loading state initially
    if (!mounted) {
        return <p>Loading...</p>;
    }

    // Calculate pagination
    const totalPages = Math.ceil(clientData.length / itemsPerPage);
    const paginatedData = clientData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Export to CSV function
    const exportToCSV = () => {
        const csv = Papa.unparse(clientData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "barometer_summary.csv";
        link.click();
    };

    // Export to PDF function
    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Barometer Daily Summary", 20, 20);

        const headers = ["Date", "Min Pressure (hPa)", "Max Pressure (hPa)", "Avg Pressure (hPa)"];
        const rows = paginatedData.map((item) => [
            item.date,
            item.min_pressure,
            item.max_pressure,
            item.avg_pressure,
        ]);

        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 30,
        });

        doc.save("barometer_summary.pdf");
    };

    // Delete row function
    const deleteRow = (date: string) => {
        const updatedData = clientData.filter((item) => item.date !== date);
        setClientData(updatedData); // Updates client-side state
        setData(updatedData); // Updates the parent state as well
    };

    return (
        <div className="w-full max-w-2xl mt-6">
            <h2 className="text-xl font-semibold mb-3">Daily Summary</h2>

            {/* Export Buttons */}
            <div className="mb-4 flex">
                <button
                    onClick={exportToCSV}
                    className="p-2 bg-green-500 text-white rounded mr-2 flex items-center hover:shadow-md hover:shadow-green-400 transition-normal"
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

            {/* Table */}
            <table className="w-full border-collapse border border-white">
                <thead>
                    <tr className="bg-wghite">
                        <th className="border p-2  text-red-500 hover:text-red-700">Date</th>
                        <th className="border p-2  text-red-500 hover:text-red-700">Min Pressure (hPa)</th>
                        <th className="border p-2  text-red-500 hover:text-red-700">Max Pressure (hPa)</th>
                        <th className="border p-2  text-red-500 hover:text-red-700">Avg Pressure (hPa)</th>
                    </tr>
                </thead>
                <tbody>
                 {paginatedData.map((item, index) => (
                 <tr key={`${item.date}-${index}`} className="text-center">
                    <td className="border p-2 text-red-500">{item.date}</td>
                    <td className="border p-2 text-red-500">{item.min_pressure}</td>
                    <td className="border p-2 text-red-500">{item.max_pressure}</td>
                    <td className="border p-2 text-red-500">{item.avg_pressure}</td>
                    <td className="p-2">
                <button
                    onClick={() => deleteRow(item.date)}
                    className="text-red-500 hover:text-red-700"
                >
                    <Image src="delete.svg" alt="Delete Icon" width={15} height={15} />
                </button>
                    </td>
                </tr>
                     ))}
            </tbody>
        </table>

            {/* Pagination */}
            <div className="mt-3">
                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                        key={i}
                        className={`mx-1 p-2 border ${currentPage === i + 1 ? "bg-red-500 text-white" : "bg-white"}`}
                        onClick={() => setCurrentPage(i + 1)}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>
        </div>
    );
}
