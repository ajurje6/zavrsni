import { useState } from "react";
import Papa from "papaparse";
import { jsPDF } from "jspdf";
import Image from 'next/image';
import autoTable from "jspdf-autotable";

interface SummaryData {
    date: string;
    min_pressure: number;
    max_pressure: number;
    avg_pressure: number;
}

interface BarometerTableProps {
    data: SummaryData[];
}

export default function BarometerTable({ data }: BarometerTableProps) {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 5; // Number of rows to display per page

    // Calculate the total number of pages
    const totalPages = Math.ceil(data.length / itemsPerPage);

    // Paginate the data based on the current page
    const paginatedData = data.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Export to CSV function
    const exportToCSV = () => {
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "barometer_summary.csv";
        link.click();
    };

    // Export to PDF function
    const exportToPDF = () => {
        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(18);
        doc.text("Barometer Daily Summary", 20, 20);
        
        // Table Headers
        doc.setFontSize(12);
        const headers = ["Date", "Min Pressure (hPa)", "Max Pressure (hPa)", "Avg Pressure (hPa)"];
        const rows = paginatedData.map(item => [
            item.date,
            item.min_pressure,
            item.max_pressure,
            item.avg_pressure
        ]);
        
        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 30,
        });

        // Save PDF
        doc.save("barometer_summary.pdf");
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
                    <Image
                    src="/csv.svg"
                    alt="CSV Icon"
                    width={20}
                    height={20}
                    className="mr-2"
                />
                    Export to CSV
                </button>
                <button
                    onClick={exportToPDF}
                    className="p-2 bg-red-500 text-white rounded flex items-center hover:shadow-md hover:shadow-red-400 transition-normal"
                >
                        <Image
                    src="/pdf.svg"
                    alt="PDF Icon"
                    width={20}
                    height={20}
                    className="mr-2"
                />
                    Export to PDF
                </button>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2 text-black">Date</th>
                        <th className="border p-2 text-black">Min Pressure (hPa)</th>
                        <th className="border p-2 text-black">Max Pressure (hPa)</th>
                        <th className="border p-2 text-black">Avg Pressure (hPa)</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.map((item) => (
                        <tr key={item.date} className="text-center">
                            <td className="border p-2">{item.date}</td>
                            <td className="border p-2">{item.min_pressure}</td>
                            <td className="border p-2">{item.max_pressure}</td>
                            <td className="border p-2">{item.avg_pressure}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination */}
            <div className="mt-3">
                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                        key={i}
                        className={`mx-1 p-2 border ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-white'}`}
                        onClick={() => setCurrentPage(i + 1)}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>
        </div>
    );
}
