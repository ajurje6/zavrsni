"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import Navbar from "./components/Navbar/Navbar";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

export default function Home() {
    const router = useRouter();
    const [L, setL] = useState<any>(null);
    const [icons, setIcons] = useState<any>(null);

    useEffect(() => {
        (async () => {
            const leaflet = await import("leaflet");

            const blueIcon = new leaflet.Icon({
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
            });

            const redIcon = new leaflet.Icon({
                iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
                iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
            });

            setL(leaflet);
            setIcons({ blueIcon, redIcon });
        })();
    }, []);

    if (!icons) return null;

    return (
        <main>
            <Navbar />

            <div style={{ height: "800px", width: "100%" }}>
                <MapContainer center={[45.1, 15.2]} zoom={7} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <Marker position={[43.538, 16.298]} icon={icons.blueIcon}>
                        <Popup>
                            <div
                                style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
                                onClick={() => router.push("/Sodar")}
                            >
                                SODAR(Split Airport)
                            </div>
                        </Popup>
                    </Marker>

                    <Marker position={[45.283, 14.533]} icon={icons.redIcon}>
                        <Popup>
                            <div
                                style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
                                onClick={() => router.push("/Barometer")}
                            >
                                Barometer(Bakar)
                            </div>
                        </Popup>
                    </Marker>
                </MapContainer>
            </div>
        </main>
    );
}









