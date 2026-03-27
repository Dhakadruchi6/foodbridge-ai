"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { MapPin, Navigation, WifiOff, Truck, Clock } from "lucide-react";
import { getRequest } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

import { ErrorBoundary } from "@/components/common/ErrorBoundary";

const LiveTrackingMap = dynamic(() => import("@/components/donor/LiveTrackingMap"), {
    ssr: false,
    loading: () => (
        <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/50">Initializing Geospatial Engine</p>
        </div>
    )
});

interface LiveData {
    liveLatitude: number | null;
    liveLongitude: number | null;
    liveLocationUpdatedAt: string | null;
    ageSeconds: number | null;
    isLive: boolean;
    donorName: string;
    ngoName?: string;
    pickupAddress?: string;
}

export default function LiveTrackPage() {
    const params = useParams();
    const donationId = params?.donationId as string;
    const [liveData, setLiveData] = useState<LiveData | null>(null);
    const [trackingStats, setTrackingStats] = useState({ distance: "...", duration: "...", isNearby: false });
    const [currentStatus, setCurrentStatus] = useState<string>("ACCEPTED");
    const [ready, setReady] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Step 8: Delay Map Render to prevent hydration/timing crashes
    useEffect(() => {
        const timer = setTimeout(() => setReady(true), 300);
        return () => clearTimeout(timer);
    }, []);

    const fetchLiveLocation = useCallback(async () => {
        try {
            const result = await getRequest(`/api/donations/live-location?donationId=${donationId}`);
            if (result.success) {
                setLiveData(result.data);
                if (result.data?.status) setCurrentStatus(result.data.status);
            }
        } catch {
            // Silently retry on next poll interval
        }
    }, [donationId]);

    useEffect(() => {
        if (!donationId) return;
        fetchLiveLocation();
        // Poll every 10 seconds for real-time updates
        intervalRef.current = setInterval(fetchLiveLocation, 10000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [donationId, fetchLiveLocation]);

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

    return (
        <div className="h-screen w-full bg-slate-950 overflow-hidden relative font-sans">
            {/* ── Header Overlay ─────────────────────────────────────── */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-sm px-4">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <Truck className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-white leading-tight">NGO Live Tracking</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                                {liveData?.donorName || 'Donor'} Destination
                            </p>
                        </div>
                    </div>
                </div>
            </div>



            {/* ── Main Map View ───────────────────────────────────────── */}
            <div className="absolute inset-0 z-0 p-4 sm:p-6 lg:p-8 pt-32 pb-48">
                <div className="w-full h-full rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl relative ring-1 ring-white/10">
                    <ErrorBoundary>
                        {!ready || !donationId ? (
                            <div className="h-full w-full bg-slate-900 flex flex-col items-center justify-center space-y-4">
                                <div className="w-12 h-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Connecting to Tracking System...</p>
                            </div>
                        ) : (
                            <div className="w-full h-full"> 
                                {liveData?.liveLatitude && liveData?.liveLongitude ? (
                                    <LiveTrackingMap
                                        donationId={donationId}
                                        pickupLat={liveData.liveLatitude}
                                        pickupLon={liveData.liveLongitude}
                                        currentStatus={currentStatus}
                                        ngoName={liveData.ngoName}
                                        destinationAddress={liveData.pickupAddress}
                                        onTrackingUpdate={(stats) => setTrackingStats(stats)}
                                        onStatusChange={(newStatus) => setCurrentStatus(newStatus)}
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-slate-900">
                                        <div className="text-center space-y-4">
                                            <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center mx-auto border border-white/5 animate-pulse">
                                                <WifiOff className="w-8 h-8 text-slate-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-black">No Signal Detected</h3>
                                                <p className="text-slate-500 text-xs mt-1">Waiting for donor to go live...</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </ErrorBoundary>
                </div>
            </div>

            {/* ── Uber-style Bottom Panel ──────────────────────────────── */}
            {liveData?.liveLatitude && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-sm px-4 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_48px_80px_-24px_rgba(0,0,0,0.6)] space-y-6">
                        {/* Status bar */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest whitespace-nowrap">
                                        {currentStatus.replace(/_/g, " ")}
                                    </p>
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                    {trackingStats.duration || "Calculating..."}
                                </h2>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Distance</p>
                                <p className="text-lg font-black text-slate-700 whitespace-nowrap">{trackingStats.distance}</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex p-1 border border-slate-50">
                            <div className={cn(
                                "h-full bg-emerald-500 rounded-full transition-all duration-1000",
                                trackingStats.isNearby ? "w-[90%]" : "w-[40%]"
                            )} />
                        </div>



                        {/* Proximity Tip */}
                        {trackingStats.isNearby && (
                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center space-x-3 animate-bounce shadow-sm">
                                <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                                    <Clock className="w-4 h-4 text-white" />
                                </div>
                                <p className="text-xs font-bold text-amber-700 leading-tight">
                                    NGO is nearby! Please ensure the food is ready for pickup.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
