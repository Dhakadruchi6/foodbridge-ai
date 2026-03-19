"use client";

import { useEffect, useState } from "react";
import { getRequest, postRequest } from "@/lib/apiClient";
import DistributionMap from "./DistributionMap";
import { Button } from "@/components/ui/button";
import { Users, Zap, CheckCircle2, Navigation, AlertCircle, X, Package, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface DistributionHubProps {
    ngoLocation: { lat: number; lng: number };
    activeDeliveryId: string | null;
    onComplete: () => void;
}

export interface SuggestionSpot {
    _id: string;
    type: string;
    name: string;
    urgency: string;
    peopleCount: number;
    distance: number;
    lat: number;
    lng: number;
}

export default function DistributionHub({ ngoLocation, activeDeliveryId, onComplete }: DistributionHubProps) {
    const [suggestions, setSuggestions] = useState<SuggestionSpot[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSpot, setSelectedSpot] = useState<SuggestionSpot | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const res = await getRequest("/api/distribution/suggest");
            if (res.success) setSuggestions(res.data);
        } catch (err) {
            console.error("Failed to fetch suggestions", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, [ngoLocation]);

    const handleCompleteDistribution = async () => {
        if (!selectedSpot || !activeDeliveryId) return;

        setIsSubmitting(true);
        try {
            const res = await postRequest("/api/distribution/complete", {
                deliveryId: activeDeliveryId,
                hungerSpotId: selectedSpot._id,
                spotType: selectedSpot.type
            });

            if (res.success) {
                setNotification({ type: 'success', message: "Food distributed successfully!" });
                setTimeout(() => {
                    onComplete();
                    setSelectedSpot(null);
                }, 2000);
            } else {
                setNotification({ type: 'error', message: res.message || "Failed to complete distribution" });
            }
        } catch (err) {
            setNotification({ type: 'error', message: "Internal server error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            {/* Local Notification */}
            {notification && (
                <div className={cn(
                    "absolute top-[-80px] left-1/2 -translate-x-1/2 z-50 p-4 rounded-2xl shadow-2xl flex items-center space-x-3 border animate-in slide-in-from-top-4 duration-300 min-w-[320px]",
                    notification.type === 'success' ? "bg-emerald-500 border-emerald-400 text-white" : "bg-rose-500 border-rose-400 text-white"
                )}>
                    {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p className="text-xs font-black uppercase tracking-widest flex-grow">{notification.message}</p>
                    <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Map View */}
                <div className="lg:col-span-8 flex-grow">
                    <div className="bg-white border border-slate-200/60 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/40">
                        <DistributionMap
                            ngoLocation={ngoLocation}
                            suggestions={suggestions}
                            onSelectSpot={(spot) => setSelectedSpot(spot as SuggestionSpot)}
                            externallySelectedSpot={selectedSpot}
                        />
                    </div>
                </div>

                {/* Suggestions Sidebar */}
                <div className="lg:w-[400px] flex-shrink-0 space-y-6">
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/40">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black tracking-tighter uppercase">AI Suggestions</h3>
                            <Zap className="w-5 h-5 text-primary animate-pulse" />
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
                                ))
                            ) : suggestions.length > 0 ? (
                                suggestions.map((spot, idx) => (
                                    <div
                                        key={spot._id}
                                        onClick={() => setSelectedSpot(spot)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && setSelectedSpot(spot)}
                                        className={cn(
                                            "w-full p-5 rounded-2xl border transition-all text-left group relative backdrop-blur-md cursor-pointer",
                                            selectedSpot?._id === spot._id
                                                ? "bg-primary border-primary shadow-xl shadow-primary/30 scale-[1.02]"
                                                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                                        )}
                                    >
                                        <div className="relative z-10 flex items-start justify-between">
                                            <div className="space-y-2">
                                                <p className={cn(
                                                    "text-[9px] font-black uppercase tracking-[0.2em]",
                                                    selectedSpot?._id === spot._id ? "text-white/70" : "text-primary/80"
                                                )}>
                                                    Spot #{idx + 1} • {spot.urgency} Urgency
                                                </p>
                                                <h4 className="font-black text-sm tracking-tight truncate leading-none uppercase">{spot.name}</h4>
                                                <div className={cn(
                                                    "flex items-center space-x-4 text-[10px] font-bold tracking-tighter",
                                                    selectedSpot?._id === spot._id ? "text-white/60" : "text-slate-400"
                                                )}>
                                                    <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1.5 opacity-70" /> {spot.peopleCount} Needy</span>
                                                    <span className="flex items-center"><Navigation className="w-3.5 h-3.5 mr-1.5 opacity-70" /> {spot.distance.toFixed(1)}km</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end space-y-2">
                                                {selectedSpot?._id === spot._id && (
                                                    <CheckCircle2 className="w-6 h-6 text-white" />
                                                )}
                                                <a
                                                    href={`https://www.google.com/maps?q=${spot.lat},${spot.lng}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={cn(
                                                        "p-2 rounded-lg transition-colors border",
                                                        selectedSpot?._id === spot._id ? "bg-white/10 border-white/20 text-white" : "bg-primary/10 border-primary/20 text-primary"
                                                    )}
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 text-center text-slate-500 space-y-4">
                                    <AlertCircle className="w-10 h-10 mx-auto opacity-10" />
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">No high-probability hotspots found in your current sector.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Panel */}
                    {selectedSpot && activeDeliveryId && (
                        <div className="p-10 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="space-y-6">
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center space-x-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center border",
                                        selectedSpot.urgency === 'high' ? "bg-rose-50 border-rose-100 text-rose-500" : "bg-indigo-50 border-indigo-100 text-indigo-500"
                                    )}>
                                        <Package className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Target Hub</p>
                                        <p className="font-black text-slate-900 uppercase tracking-tight">{selectedSpot.name}</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleCompleteDistribution}
                                    disabled={isSubmitting}
                                    className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95"
                                >
                                    {isSubmitting ? "Processing..." : "Authorize Delivery"}
                                </Button>
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSpot.lat},${selectedSpot.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full h-12 rounded-2xl border-2 border-slate-900 flex items-center justify-center space-x-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                                >
                                    <Navigation className="w-4 h-4" />
                                    <span>Open Directions</span>
                                </a>
                                <p className="text-[9px] text-center text-slate-400 font-black uppercase tracking-widest">
                                    Security audit will be finalized upon authorization.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
