"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function Navbar(){
    const pathname = usePathname(); // Gets the current route
    return(
        <div>
          <ul className="flex justify-center p-6 border-b-2 border-red-500">
                <li>
                    <Link href="/"  className={`p-2 cursor-pointer transition-colors duration-300 ease-in-out ${
                  pathname === '/' ? 'text-red-500 border-b-2 border-red-500' : 'text-red-500 hover:text-red-900'
                }`}>
                    BAROMETER
                    </Link>
                    </li>
                <li>
                    <Link href="/Sodar" className={`p-2 cursor-pointer transition-colors duration-300 ease-in-out ${
                  pathname === '/Sodar' ? 'text-red-500 border-b-2 border-red-500' : 'text-red-600 hover:text-red-900'
                }`}>
                    SODAR
                    </Link> 
                    </li>
            </ul>
        </div>
    );
}