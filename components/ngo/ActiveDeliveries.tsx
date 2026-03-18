"use client";

import { useEffect, useState } from "react";
import { getRequest } from "@/lib/apiClient";
import {
    Package,
    MapPin,
    CheckCircle2,
    Loader2,
    Truck,
    ArrowUpRight,
    CircleDashed,
    Circle,
    Wifi
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useLocationSync } from "@/hooks/useLocationSync";

interface Delivery {
    _id: string;
    donationId: {
        _id: string;
        foodType: string;
        quantity: number | string;
        pickupAddress: string;
        city: string;
    };
    status: "accepted" | "pickup_in_progress" | "delivered" | "completed";
}

export const ActiveDeliveries = ({ refreshKey = 0 }: { refreshKey?: number }) => {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTrackingId, setActiveTrackingId] = useState<string | null>(null);
    const [activeDonationId, setActiveDonationId] = useState<string | null>(null);

    // Get the donationId for the currently tracking delivery
    const { lastSynced, error } = useLocationSync(activeDonationId, !!activeTrackingId);

    const fetchDeliveries = async () => {
        try {
            const result = await getRequest("/api/donations/my-deliveries");
            if (result.success) {
                setDeliveries(result.data);
            }
        } catch (err) {
            console.error("Failed to fetch active deliveries", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
        const interval = setInterval(fetchDeliveries, 30000); // Auto-refresh every 30s

        // Smart Sync: Refresh when returning to dashboard
        window.addEventListener('focus', fetchDeliveries);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', fetchDeliveries);
        };
    }, [refreshKey]);

    const toggleTracking = (deliveryId: string, donationId: string) => {
        if (activeTrackingId === deliveryId) {
            setActiveTrackingId(null);
            setActiveDonationId(null);
        } else {
            setActiveTrackingId(deliveryId);
            setActiveDonationId(donationId);
        }
    };

    if (loading) return (
        <div className="space-y-3">
            {[1, 2].map(i => (
                <div key={i} className="h-16 bg-white/10 rounded-xl animate-pulse" />
            ))}
        </div>
    );

    const activeOnlyDeliveries = deliveries.filter(d => d.status !== 'completed');

    if (activeOnlyDeliveries.length === 0) return (
        <div className="p-6 text-center border border-slate-200/50 rounded-xl bg-slate-50/50">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">No Active Fleet Missions</p>
        </div>
    );

    return (
        <div className="space-y-3">
            {activeOnlyDeliveries.slice(0, 4).map((delivery) => (
                <div key={delivery._id} className={cn(
                    "p-4 rounded-xl border transition-all duration-300 flex items-center justify-between group",
                    activeTrackingId === delivery._id ? "bg-emerald-50/50 border-emerald-200 shadow-sm" : "bg-white border-slate-100"
                )}>
                    <div className="flex items-center space-x-3 min-w-0">
                        <div className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                            activeTrackingId === delivery._id ? "bg-emerald-500 text-white border-emerald-400 animate-pulse" :
                                delivery.status === 'completed' ? "bg-emerald-50 text-emerald-500 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                        )}>
                            {activeTrackingId === delivery._id ? <Wifi className="w-4 h-4" /> :
                                delivery.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-[13px] font-black text-slate-800 leading-none truncate">
                                {delivery.donationId?.foodType || "Surplus Batch"}
                            </h4>
                            <div className="flex items-center text-[10px] font-bold text-slate-400 mt-1.5">
                                <MapPin className="w-3 h-3 mr-1 text-slate-300" />
                                <span className="truncate">{delivery.donationId?.city} Zone</span>
                                {activeTrackingId === delivery._id && (
                                    <span className="ml-2 text-emerald-500 animate-pulse">● LIVE</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                        <button
                            onClick={() => toggleTracking(delivery._id, delivery.donationId?._id)}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded transition-all",
                                activeTrackingId === delivery._id
                                    ? "bg-emerald-500 text-white shadow-sm"
                                    : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                            )}
                        >
                            {activeTrackingId === delivery._id ? "Tracking..." : "Go Live"}
                        </button>

                        <Link href={`/dashboard/ngo/logistics?deliveryId=${delivery._id}`} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-300 hover:text-indigo-600">
                            <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    );
};
