"use client";

import { useEffect, useState } from "react";
import { getRequest } from "@/lib/apiClient";
import {
    CheckCircle2,
    Circle,
    Clock,
    Truck,
    Box,
    Loader2,
    Phone,
    Mail,
    User,
    MapPin,
    Package,
    Calendar,
    Navigation
} from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const LiveTrackingMap = dynamic(() => import("./LiveTrackingMap"), {
    ssr: false,
    loading: () => <div className="h-48 bg-slate-50 animate-pulse rounded-2xl border border-slate-100 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-slate-300">Loading Geospatial Engine...</div>
});

interface TrackingInfo {
    status: 'accepted' | 'pickup_in_progress' | 'delivered' | 'completed';
    ngoId: {
        _id: string;
        name: string;
        email: string;
    };
    ngoProfile: {
        ngoName: string;
        contactPhone: string;
        address: string;
        city: string;
    } | null;
    donation: {
        foodType: string;
        quantity: string;
        city: string;
        pickupAddress: string;
        expiryTime: string;
        latitude?: number;
        longitude?: number;
    } | null;
    pickupTime: string | null;
    deliveryTime: string | null;
    createdAt: string;
    updatedAt: string;
}

export const DeliveryTracking = ({ donationId }: { donationId: string }) => {
    const [info, setInfo] = useState<TrackingInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchTracking = async () => {
            try {
                const result = await getRequest(`/api/donations/track?donationId=${donationId}`);
                if (result.success) {
                    setInfo(result.data);
                } else {
                    setError(result.message);
                }
            } catch (err: any) {
                setError(err.message || "Failed to load tracking info");
            } finally {
                setLoading(false);
            }
        };
        fetchTracking();
    }, [donationId]);

    if (loading) return (
        <div className="flex items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Syncing with logistics fleet...
        </div>
    );

    if (error || !info) return (
        <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-sm text-center font-bold">
            {error || "Tracking details will appear once an NGO accepts the batch."}
        </div>
    );

    const ngoName = info.ngoProfile?.ngoName || info.ngoId?.name || "NGO Partner";
    const ngoEmail = info.ngoId?.email || "";
    const ngoPhone = info.ngoProfile?.contactPhone || "";
    const ngoCity = info.ngoProfile?.city || "";

    const steps = [
        {
            key: 'accepted',
            label: 'Mission Accepted',
            desc: 'NGO has secured the batch',
            icon: <CheckCircle2 className="w-5 h-5" />,
            time: info.createdAt
        },
        {
            key: 'pickup_in_progress',
            label: 'Pickup In Progress',
            desc: 'Fleet has collected the batch',
            icon: <Truck className="w-5 h-5" />,
            time: info.pickupTime
        },
        {
            key: 'completed',
            label: 'Mission Success',
            desc: 'Securely delivered to hub',
            icon: <Box className="w-5 h-5" />,
            time: info.deliveryTime
        }
    ];

    const currentIdx = steps.findIndex(s => s.key === info.status);

    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
            " · " + d.toLocaleDateString([], { day: '2-digit', month: 'short' });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4">

            {/* Donation Details Card */}
            {info.donation && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Food Item</span>
                        <span className="text-sm font-black text-slate-800">{info.donation.foodType || "—"}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Quantity</span>
                        <span className="text-sm font-black text-slate-800">{info.donation.quantity}kg</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Pickup</span>
                        <span className="text-xs font-bold text-slate-600">{info.donation.pickupAddress || info.donation.city}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Expires</span>
                        <span className="text-xs font-bold text-amber-600">
                            {info.donation.expiryTime ? new Date(info.donation.expiryTime).toLocaleDateString() : "N/A"}
                        </span>
                    </div>
                </div>
            )}

            {/* LIVE TRACKING MAP */}
            {info.status !== 'completed' && info.donation?.latitude && info.donation?.longitude && (
                <div className="space-y-4 animate-in fade-in duration-700">
                    {/* Zomato-style Status Banner */}
                    {info.status === 'pickup_in_progress' && (
                        <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20 text-white flex items-center justify-between overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                <Navigation className="w-12 h-12" />
                            </div>
                            <div className="flex items-center space-x-4 relative z-10">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 animate-pulse">
                                    <Truck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Real-Time Insight</p>
                                    <h4 className="text-sm font-black tracking-tight">
                                        NGO Partner is navigating to your location
                                    </h4>
                                </div>
                            </div>
                            <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest relative z-10">
                                Arriving Soon
                            </div>
                        </div>
                    )}

                    <LiveTrackingMap
                        donationId={donationId}
                        pickupLat={info.donation.latitude}
                        pickupLon={info.donation.longitude}
                    />
                </div>
            )}

            {/* NGO Partner Card */}
            <div className="flex items-center justify-between p-5 bg-indigo-600 rounded-[1.5rem] shadow-xl text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Truck className="w-16 h-16" /></div>
                <div className="flex items-center space-x-4 relative z-10">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 leading-none mb-1.5">Operational Partner</p>
                        <h5 className="text-lg font-black tracking-tight leading-none">{ngoName}</h5>
                        {ngoCity && (
                            <p className="text-[10px] font-bold text-indigo-300 mt-1 flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />{ngoCity}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-2 relative z-10">
                    {ngoPhone && ngoPhone !== "Not specified" && (
                        <a
                            href={`tel:${ngoPhone}`}
                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center transition-colors"
                        >
                            <Phone className="w-3.5 h-3.5 mr-2" />
                            Call
                        </a>
                    )}
                    {ngoEmail && (
                        <a
                            href={`mailto:${ngoEmail}`}
                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center transition-colors"
                        >
                            <Mail className="w-3.5 h-3.5 mr-2" />
                            Email
                        </a>
                    )}
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-6 px-4">
                {steps.map((step, idx) => {
                    const isDone = idx <= currentIdx;
                    const isFuture = idx > currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                        <div key={idx} className="flex group relative">
                            {/* Line */}
                            {idx < steps.length - 1 && (
                                <div className={cn(
                                    "absolute left-[20px] top-[40px] w-0.5 h-[calc(100%+8px)] bg-slate-100",
                                    isDone && "bg-emerald-500/20"
                                )} />
                            )}

                            {/* Icon Container */}
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500 relative z-10 bg-white",
                                isDone ? "border-emerald-500 text-emerald-500 shadow-lg shadow-emerald-500/20" : "border-slate-200 text-slate-300",
                                isCurrent && "animate-pulse scale-110"
                            )}>
                                {isFuture ? <Circle className="w-4 h-4" /> : step.icon}
                            </div>

                            {/* Text */}
                            <div className="ml-6 space-y-0.5 mt-0.5 flex-1">
                                <p className={cn(
                                    "text-sm font-black uppercase tracking-widest leading-none",
                                    isDone ? "text-slate-900" : "text-slate-400"
                                )}>
                                    {step.label}
                                </p>
                                <p className="text-xs font-bold text-slate-400">
                                    {isDone ? step.desc : "Awaiting operational trigger..."}
                                </p>
                            </div>

                            {/* Timestamp */}
                            {isDone && step.time && (
                                <div className="ml-auto shrink-0">
                                    <span className="text-[10px] font-black text-slate-400 px-2 py-1 bg-slate-100 rounded-md whitespace-nowrap">
                                        {formatTime(step.time)}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Completion message */}
            {info.status === 'completed' && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-black text-emerald-700">Mission Completed Successfully!</p>
                    <p className="text-xs font-bold text-emerald-500 mt-1">Food has been delivered to the distribution hub</p>
                </div>
            )}
        </div>
    );
};
