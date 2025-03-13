import { useState } from "react";

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

    return (
        <div className="w-full max-w-2xl mt-6">
            <h2 className="text-xl font-semibold mb-3">Daily Summary</h2>

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
