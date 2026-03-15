"use client";

import { useState, useEffect, useRef } from "react";
import { Navigation, Wifi, WifiOff, MapPin, Radio, X } from "lucide-react";
import { postRequest } from "@/lib/apiClient";

interface Props {
    donationId: string;
    donationStatus: string;
}

export const LiveLocationShare = ({ donationId, donationStatus }: Props) => {
    const [isLive, setIsLive] = useState(false);
    const [lastSent, setLastSent] = useState<Date | null>(null);
    const [error, setError] = useState("");
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const latestCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

    const sendLocation = async (lat: number, lng: number) => {
        try {
            await postRequest("/api/donations/live-location", {
                donationId,
                latitude: lat,
                longitude: lng,
            });
            setLastSent(new Date());
        } catch (err) {
            // Silent fail - retry on next interval
        }
    };

    const startLive = () => {
        if (!navigator.geolocation) {
            setError("Geolocation not supported by your browser");
            return;
        }
        setError("");
        setIsLive(true);

        // Watch position in real-time
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                latestCoordsRef.current = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
            },
            (err) => {
                setError("Location access denied. Please enable it in browser settings.");
                stopLive();
            },
            { enableHighAccuracy: true, maximumAge: 5000 }
        );

        // Push to backend every 10 seconds
        intervalRef.current = setInterval(() => {
            if (latestCoordsRef.current) {
                sendLocation(latestCoordsRef.current.lat, latestCoordsRef.current.lng);
            }
        }, 10000);

        // Send immediately on start
        navigator.geolocation.getCurrentPosition((pos) => {
            sendLocation(pos.coords.latitude, pos.coords.longitude);
        });
    };

    const stopLive = () => {
        setIsLive(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };

    useEffect(() => {
        return () => stopLive();
    }, []);

    // Only show for accepted donations (NGO picked one up)
    if (donationStatus !== "accepted" && donationStatus !== "picked_up") return null;

    return (
        <div className={`rounded-xl border p-4 space-y-3 transition-all ${isLive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isLive ? 'text-emerald-700' : 'text-slate-600'}`}>
                        {isLive ? 'Broadcasting Live Location' : 'Live Location Off'}
                    </span>
                </div>
                {isLive && lastSent && (
                    <span className="text-[9px] font-bold text-emerald-600">
                        Last sent: {lastSent.toLocaleTimeString()}
                    </span>
                )}
            </div>

            {error && (
                <p className="text-[10px] text-rose-600 font-bold">{error}</p>
            )}

            {isLive ? (
                <div className="space-y-2">
                    <p className="text-[10px] text-emerald-600 font-bold">
                        📡 Your location is being shared with the NGO every 10 seconds.
                    </p>
                    <button
                        onClick={stopLive}
                        className="w-full h-9 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                        <span>Stop Sharing</span>
                    </button>
                </div>
            ) : (
                <button
                    onClick={startLive}
                    className="w-full h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 transition-colors shadow-sm"
                >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Go Live — Share My Location</span>
                </button>
            )}
        </div>
    );
};
