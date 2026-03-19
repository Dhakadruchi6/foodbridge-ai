"use client";

import { useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { MapPin, Users, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DistributionMarker {
    _id: string;
    lat: number;
    lng: number;
    urgency: string;
    name: string;
    type?: string;
    peopleCount?: number;
    distance?: number;
}

interface DistributionMapProps {
    ngoLocation: { lat: number; lng: number };
    suggestions: DistributionMarker[];
    onSelectSpot: (spot: DistributionMarker) => void;
}

const mapContainerStyle = {
    width: "100%",
    height: "500px",
    borderRadius: "1.5rem",
};

const urgencyColors: Record<string, string> = {
    high: "#f43f5e",   // Rose 500
    medium: "#f59e0b", // Amber 500
    low: "#10b981",    // Emerald 500
};

export default function DistributionMap({ ngoLocation, suggestions, onSelectSpot }: DistributionMapProps) {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    });

    const [selectedSpot, setSelectedSpot] = useState<DistributionMarker | null>(null);

    if (!isLoaded) return <div className="h-[500px] w-full bg-slate-100 animate-pulse rounded-[1.5rem]" />;

    return (
        <div className="relative group">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={ngoLocation}
                zoom={13}
                options={{
                    styles: [
                        {
                            featureType: "all",
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#6e7e8e" }],
                        },
                        {
                            featureType: "water",
                            elementType: "geometry",
                            stylers: [{ color: "#e9edf1" }],
                        },
                    ],
                    disableDefaultUI: true,
                    zoomControl: true,
                }}
            >
                {/* NGO Location Marker */}
                <Marker
                    position={ngoLocation}
                    icon={{
                        url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                    }}
                    title="Your NGO Hub"
                    onClick={() => setSelectedSpot({
                        _id: "ngo-hub",
                        name: "Your NGO Hub",
                        lat: ngoLocation.lat,
                        lng: ngoLocation.lng,
                        type: "ngo",
                        urgency: "low"
                    })}
                />

                {/* Hunger Spot Markers */}
                {suggestions.map((spot) => (
                    <Marker
                        key={spot._id}
                        position={{ lat: spot.lat, lng: spot.lng }}
                        icon={{
                            path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
                            fillColor: urgencyColors[spot.urgency] || "#6366f1",
                            fillOpacity: 0.9,
                            strokeWeight: 2,
                            strokeColor: "#ffffff",
                            scale: 1.5,
                            anchor: isLoaded ? new google.maps.Point(12, 22) : undefined,
                        }}
                        onClick={() => setSelectedSpot(spot)}
                    />
                ))}

                {selectedSpot && (
                    <InfoWindow
                        position={{ lat: selectedSpot.lat, lng: selectedSpot.lng }}
                        onCloseClick={() => setSelectedSpot(null)}
                    >
                        <div className="p-3 bg-white rounded-xl shadow-sm min-w-[200px]">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    selectedSpot.type === 'ngo' ? "bg-blue-500" : (urgencyColors[selectedSpot.urgency] || "bg-indigo-500")
                                )} />
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">{selectedSpot.name}</h3>
                            </div>

                            {selectedSpot.type !== 'ngo' && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                        <span className="flex items-center"><Users className="w-3 h-3 mr-1" /> {selectedSpot.peopleCount} People</span>
                                        <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {selectedSpot.distance?.toFixed(1)} km</span>
                                    </div>
                                    <button
                                        onClick={() => onSelectSpot(selectedSpot)}
                                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Select for Delivery</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>

            {/* Legend Overlay */}
            <div className="absolute top-4 left-4 p-3 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 z-10 hidden md:block">
                <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest text-slate-600">
                        <div className="w-3 h-3 rounded-full bg-rose-500" /> <span>High Urgency</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest text-slate-600">
                        <div className="w-3 h-3 rounded-full bg-amber-500" /> <span>Medium Priority</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest text-slate-600">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" /> <span>Stable / Low</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
