"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getRequest } from "@/lib/apiClient";
import { Navigation, Loader2, MapPin, Truck } from "lucide-react";

// Fix Leaflet marker icon issue in Next.js
const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const ngoIcon = L.divIcon({
    html: `<div class="w-10 h-10 bg-indigo-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3m15 0h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"></path><circle cx="7.5" cy="17.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>
           </div>`,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

function MapRecenter({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
}

interface LiveTrackingMapProps {
    donationId: string;
    pickupLat: number;
    pickupLon: number;
}

export default function LiveTrackingMap({ donationId, pickupLat, pickupLon }: LiveTrackingMapProps) {
    const [ngoPos, setNgoPos] = useState<[number, number] | null>(null);
    const [loading, setLoading] = useState(true);
    const [ngoInfo, setNgoInfo] = useState<any>(null);

    const fetchNgoLocation = async () => {
        try {
            const res = await getRequest(`/api/donations/live-location?donationId=${donationId}`);
            if (res.success && res.data.isLive) {
                setNgoPos([res.data.liveLatitude, res.data.liveLongitude]);
                setNgoInfo(res.data);
            }
        } catch (err) {
            console.error("Map tracking fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNgoLocation();
        const interval = setInterval(fetchNgoLocation, 5000);
        return () => clearInterval(interval);
    }, [donationId]);

    if (loading) return (
        <div className="h-64 flex flex-col items-center justify-center bg-slate-100 rounded-2xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Initializing Satellite Uplink...</p>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center border border-indigo-200">
                        <Truck className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-900 leading-none">
                            {ngoInfo?.ngoName || "NGO Partner"}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                            {ngoPos ? "In Transit (Real-Time)" : "Waiting for NGO to start transit"}
                        </p>
                    </div>
                </div>
                {ngoInfo?.ageSeconds !== undefined && (
                    <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Updated {ngoInfo.ageSeconds}s ago</span>
                    </div>
                )}
            </div>

            <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md relative z-0">
                <MapContainer
                    center={[pickupLat, pickupLon]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />

                    {/* Pickup Point */}
                    <Marker position={[pickupLat, pickupLon]} icon={defaultIcon}>
                        <Popup>
                            <span className="font-bold">Pickup Location</span>
                        </Popup>
                    </Marker>

                    {/* NGO Live Position */}
                    {ngoPos && (
                        <>
                            <Marker position={ngoPos} icon={ngoIcon}>
                                <Popup>
                                    <span className="font-bold">{ngoInfo.ngoName}</span>
                                </Popup>
                            </Marker>
                            <MapRecenter center={ngoPos} />
                        </>
                    )}
                </MapContainer>
            </div>
        </div>
    );
}
