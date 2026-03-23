"use client";

import { useEffect, useState, useCallback } from "react";
import { getRequest, patchRequest } from "@/lib/apiClient";
import {
    MapPin, Phone, Package, Clock, Navigation,
    CheckCircle2, AlertTriangle, Loader2, RefreshCw, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import HungerDeliveryTracker from "./HungerDeliveryTracker";

interface HungerRequest {
    _id: string;
    name: string;
    phone: string;
    locationName: string;
    address: string;
    quantity: number;
    description: string;
    urgency: "low" | "medium" | "high";
    status: string;
    distanceKm?: number;
    lat: number;
    lng: number;
    createdAt: string;
}

export default function HungerRequests({ ngoLat, ngoLng }: { ngoLat: number; ngoLng: number }) {
    const [requests, setRequests] = useState<HungerRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState<string | null>(null);
    const [trackedRequest, setTrackedRequest] = useState<HungerRequest | null>(null);
    const [notification, setNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getRequest(
                `/api/hunger-reports?lat=${ngoLat}&lng=${ngoLng}&radius=30`
            );
            if (res.success) setRequests(res.data);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [ngoLat, ngoLng]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleAccept = async (req: HungerRequest) => {
        setAccepting(req._id);
        try {
            const res = await patchRequest(`/api/hunger-reports/${req._id}/accept`, {});
            if (res.success) {
                setNotification({ type: "success", msg: "Request accepted! Please head to the location." });
                setRequests(prev => prev.filter(r => r._id !== req._id));
                setTrackedRequest({ ...req, status: "accepted" });
            } else {
                setNotification({ type: "error", msg: res.message || "Failed to accept request." });
            }
        } catch {
            setNotification({ type: "error", msg: "Something went wrong." });
        } finally {
            setAccepting(null);
            setTimeout(() => setNotification(null), 4000);
        }
    };

    const handleViewLocation = (req: HungerRequest) => {
        const url = `https://www.google.com/maps/dir/?api=1&origin=${ngoLat},${ngoLng}&destination=${req.lat},${req.lng}&travelmode=driving`;
        window.open(url, "_blank");
    };

    const timeAgo = (date: string) => {
        const diff = (Date.now() - new Date(date).getTime()) / 1000;
        if (diff < 60) return "just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    if (trackedRequest) {
        return (
            <HungerDeliveryTracker
                request={trackedRequest}
                onComplete={() => { setTrackedRequest(null); fetchRequests(); }}
                onBack={() => setTrackedRequest(null)}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Hunger Requests Near You</h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Showing requests within 30 km of your location</p>
                </div>
                <button
                    onClick={fetchRequests}
                    disabled={loading}
                    className="flex items-center space-x-1.5 text-xs font-black text-primary hover:text-primary/80 transition-colors"
                >
                    <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Notification */}
            {notification && (
                <div className={cn(
                    "flex items-center space-x-3 p-4 rounded-xl border text-sm font-semibold",
                    notification.type === "success"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-rose-50 text-rose-600 border-rose-100"
                )}>
                    {notification.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                    <span>{notification.msg}</span>
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">No pending requests near you right now.</p>
                    <p className="text-slate-400 text-xs">Great job! Check back later.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map(req => (
                        <div
                            key={req._id}
                            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 hover:shadow-md transition-shadow"
                        >
                            {/* Top row */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                            req.urgency === "high" ? "bg-rose-100 text-rose-600"
                                                : req.urgency === "medium" ? "bg-amber-100 text-amber-700"
                                                    : "bg-emerald-100 text-emerald-700"
                                        )}>
                                            {req.urgency === "high" ? "🔴" : req.urgency === "medium" ? "🟡" : "🟢"} {req.urgency}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium flex items-center space-x-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{timeAgo(req.createdAt)}</span>
                                        </span>
                                    </div>
                                    <h3 className="font-black text-slate-900 dark:text-white text-base">{req.name}</h3>
                                    <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                                        <MapPin className="w-3 h-3" />
                                        <span className="truncate">{req.locationName}</span>
                                    </p>
                                </div>
                                {req.distanceKm !== undefined && (
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xl font-black text-primary">{req.distanceKm}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">km away</p>
                                    </div>
                                )}
                            </div>

                            {/* Details row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center space-x-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                    <Package className="w-4 h-4 text-slate-400" />
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Quantity</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white">{req.quantity} servings</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Contact</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white">{req.phone}</p>
                                    </div>
                                </div>
                            </div>

                            {req.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl font-medium leading-relaxed">
                                    {req.description}
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center space-x-3 pt-2">
                                <button
                                    onClick={() => handleViewLocation(req)}
                                    className="flex-1 flex items-center justify-center space-x-2 h-10 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-wider hover:border-primary hover:text-primary transition-all"
                                >
                                    <Navigation className="w-3.5 h-3.5" />
                                    <span>View Location</span>
                                    <ExternalLink className="w-3 h-3" />
                                </button>
                                <Button
                                    onClick={() => handleAccept(req)}
                                    disabled={accepting === req._id}
                                    className="flex-1 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider space-x-2 flex items-center justify-center"
                                >
                                    {accepting === req._id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Accept Request</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
