"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { MapPin, Navigation, Wifi, WifiOff, RefreshCw, ChevronRight, Package } from "lucide-react";
import { getRequest } from "@/lib/apiClient";

interface LiveData {
    liveLatitude: number | null;
    liveLongitude: number | null;
    liveLocationUpdatedAt: string | null;
    ageSeconds: number | null;
    isLive: boolean;
    donorName: string;
}

export default function LiveTrackPage() {
    const params = useParams();
    const donationId = params?.donationId as string;
    const [liveData, setLiveData] = useState<LiveData | null>(null);
    const [error, setError] = useState("");
    const [pulseCount, setPulseCount] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchLiveLocation = async () => {
        try {
            const result = await getRequest(`/api/donations/live-location?donationId=${donationId}`);
            if (result.success) {
                setLiveData(result.data);
                setPulseCount(c => c + 1);
            }
        } catch (err: any) {
            setError("Could not fetch live location data.");
        }
    };

    useEffect(() => {
        if (!donationId) return;
        fetchLiveLocation();
        // Poll every 10 seconds for real-time updates
        intervalRef.current = setInterval(fetchLiveLocation, 10000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [donationId]);

    const openGoogleMaps = () => {
        if (liveData?.liveLatitude && liveData?.liveLongitude) {
            window.open(
                `https://www.google.com/maps?q=${liveData.liveLatitude},${liveData.liveLongitude}&z=17`,
                '_blank'
            );
        }
    };

    const openNavigation = () => {
        if (liveData?.liveLatitude && liveData?.liveLongitude) {
            window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${liveData.liveLatitude},${liveData.liveLongitude}`,
                '_blank'
            );
        }
    };

    const getAgeLabel = (seconds: number | null) => {
        if (seconds === null) return "Never updated";
        if (seconds < 10) return "Just now";
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return "Over 1 hour ago";
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-lg space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <div className={`w-3 h-3 rounded-full ${liveData?.isLive ? 'bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-slate-600'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${liveData?.isLive ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {liveData?.isLive ? 'Live Tracking Active' : 'Waiting for Donor...'}
                        </span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter">
                        {liveData?.donorName || 'Donor'} Live Location
                    </h1>
                    <p className="text-slate-400 text-sm font-medium">
                        Auto-refreshes every 10 seconds
                    </p>
                </div>

                {/* Location Card */}
                <div className={`rounded-2xl p-6 border ${liveData?.isLive ? 'bg-emerald-950/60 border-emerald-800/40' : 'bg-slate-900 border-slate-800'} space-y-5`}>
                    {liveData?.liveLatitude && liveData?.liveLongitude ? (
                        <>
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">GPS Coordinates</p>
                                    <p className="font-black text-xl font-mono text-emerald-400">
                                        {liveData.liveLatitude.toFixed(5)}, {liveData.liveLongitude.toFixed(5)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Updated</p>
                                    <p className={`text-sm font-black ${liveData.isLive ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {getAgeLabel(liveData.ageSeconds)}
                                    </p>
                                </div>
                            </div>

                            {/* Map Embed-like link block */}
                            <button
                                onClick={openGoogleMaps}
                                className="w-full bg-slate-800 hover:bg-slate-700 rounded-xl p-4 flex items-center justify-between group transition-colors border border-slate-700 hover:border-emerald-800/50"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-900/50 border border-emerald-800/40 flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-white text-sm">View on Google Maps</p>
                                        <p className="text-[10px] text-slate-500 font-bold">Tap to open pinned location</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                            </button>

                            {/* Navigation */}
                            <button
                                onClick={openNavigation}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 rounded-xl p-4 flex items-center justify-center space-x-3 transition-colors font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-900/40"
                            >
                                <Navigation className="w-5 h-5" />
                                <span>Get Directions (Turn-by-Turn)</span>
                            </button>

                            <button
                                onClick={fetchLiveLocation}
                                className="w-full bg-white/5 hover:bg-white/10 rounded-xl p-3 flex items-center justify-center space-x-2 transition-colors border border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-400"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Refresh Now</span>
                            </button>
                        </>
                    ) : (
                        <div className="text-center py-10 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto">
                                <WifiOff className="w-7 h-7 text-slate-600" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-slate-300">No Live Signal Yet</h3>
                                <p className="text-slate-500 text-sm font-medium mt-1">
                                    Ask the donor to click <strong>"Go Live"</strong> on their dashboard to start sharing their location.
                                </p>
                            </div>
                            <button
                                onClick={fetchLiveLocation}
                                className="mx-auto h-11 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-black uppercase tracking-widest flex items-center space-x-2 transition-colors border border-slate-700"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>Check Again</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Info Footer */}
                <p className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    Polling interval: 10s · Powered by FoodBridge AI
                </p>
            </div>
        </div>
    );
}
