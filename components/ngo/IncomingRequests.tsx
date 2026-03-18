"use client";

import { useEffect, useState } from "react";
import { getRequest, postRequest } from "@/lib/apiClient";
import {
    Clock,
    Check,
    X,
    AlertCircle,
    Loader2,
    Package,
    MapPin,
    ChevronRight,
    ThumbsUp,
    ThumbsDown,
    Activity,
    ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Request {
    _id: string;
    donationId: {
        _id: string;
        foodType: string;
        quantity: number | string;
        expiryTime: string;
        city: string;
        status: string;
        prioritizationRank?: number;
        donorId?: {
            name: string;
            email: string;
            phone: string;
        };
    };
    status: string;
    createdAt: string;
}

export const IncomingRequests = ({ onAction }: { onAction?: () => void }) => {
    const router = useRouter();
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [error, setError] = useState("");

    const fetchRequests = async () => {
        try {
            const result = await getRequest("/api/donations/requests");
            if (result.success) {
                setRequests(result.data);
            }
        } catch (err) {
            console.error("Failed to fetch requests", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
        const interval = setInterval(fetchRequests, 30000); // Auto-refresh every 30s

        // Industry-level: Refresh when window gains focus (e.g., user comes back)
        window.addEventListener('focus', fetchRequests);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', fetchRequests);
        };
    }, []);

    const [acceptedId, setAcceptedId] = useState<string | null>(null);

    const handleAccept = async (donationId: string) => {
        setProcessingId(donationId);
        setError("");
        try {
            const result = await postRequest("/api/donations/accept", { donationId });
            if (result.success) {
                setAcceptedId(donationId);
                // Smart UI Update: Filter and Notify dashboard
                setTimeout(() => {
                    setRequests(prev => prev.filter(req => req.donationId?._id !== donationId));
                    if (onAction) onAction(); // Refreshes ActiveDeliveries on main dashboard
                    // No router.push - stay on dashboard as requested
                }, 1500);
            } else {
                setError(result.message || "Failed to accept request.");
                if (result.message?.toLowerCase().includes("processed") || result.message?.toLowerCase().includes("active")) {
                    setTimeout(fetchRequests, 2000);
                }
            }
        } catch (err: any) {
            setError(err.message || "Network error occurred.");
            fetchRequests();
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (donationId: string) => {
        setProcessingId(donationId);
        setError("");
        try {
            const result = await postRequest("/api/donations/reject", { donationId });
            if (result.success) {
                fetchRequests();
                if (onAction) onAction();
            } else {
                setError(result.message || "Failed to reject request.");
                // If stale data, refresh
                if (result.message?.toLowerCase().includes("processed") || result.message?.toLowerCase().includes("found")) {
                    setTimeout(fetchRequests, 1500);
                }
            }
        } catch (err: any) {
            setError(err.message || "Network error occurred.");
            fetchRequests();
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return (
        <div className="space-y-3">
            {[1, 2].map(i => (
                <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />
            ))}
        </div>
    );

    const pendingRequests = requests.filter(r =>
        r.donationId?.status === 'pending_request' ||
        r.donationId?.status === 'request_sent'
    );

    if (pendingRequests.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2 px-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Targeted Requests</h3>
                <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-600 text-[9px] font-black">{pendingRequests.length}</span>
            </div>

            {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-black uppercase tracking-wider flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {error}
                </div>
            )}

            <div className="space-y-3">
                {pendingRequests.map((req) => (
                    <div key={req._id} className="group relative bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between">
                            <div className="space-y-3 flex-1">
                                <div className="flex items-center space-x-2">
                                    <h4 className="text-sm font-black text-slate-900 tracking-tight">{req.donationId?.foodType}</h4>
                                    <div className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[8px] font-black uppercase tracking-widest">
                                        {req.donationId?.quantity}kg Payload
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center text-[10px] font-bold text-slate-400">
                                        <MapPin className="w-3.5 h-3.5 mr-1" />
                                        {req.donationId?.city} Zone
                                    </div>
                                    <div className="flex items-center text-[10px] font-bold text-rose-500">
                                        <Clock className="w-3.5 h-3.5 mr-1" />
                                        Priority: {req.donationId?.prioritizationRank || "65"}/100
                                    </div>
                                </div>
                                <div className="pt-2 flex items-center space-x-2 border-t border-slate-100">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400 border border-slate-200">
                                        {(req.donationId?.donorId?.name?.[0] || 'D').toUpperCase()}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500">
                                        Donor: <span className="text-slate-700 font-black">{req.donationId?.donorId?.name || "Anonymous Donor"}</span>
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Button
                                    onClick={() => handleReject(req.donationId?._id)}
                                    disabled={processingId !== null}
                                    variant="outline"
                                    className="h-10 w-10 p-0 rounded-xl border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                                <Button
                                    onClick={() => handleAccept(req.donationId?._id)}
                                    disabled={
                                        processingId !== null ||
                                        acceptedId === req.donationId?._id ||
                                        (req.donationId?.status !== 'pending_request' && req.donationId?.status !== 'request_sent')
                                    }
                                    className={cn(
                                        "h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                                        acceptedId === req.donationId?._id
                                            ? "bg-indigo-600 text-white shadow-xl scale-105"
                                            : (req.donationId?.status !== 'pending_request' && req.donationId?.status !== 'request_sent')
                                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                                : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                    )}
                                >
                                    {processingId === req.donationId?._id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : acceptedId === req.donationId?._id ? (
                                        <>Mission Deployed <ShieldCheck className="ml-2 w-3 h-3 animate-bounce" /></>
                                    ) : (req.donationId?.status !== 'pending_request' && req.donationId?.status !== 'request_sent') ? (
                                        <>Already Processed</>
                                    ) : (
                                        <>Deploy Now <Check className="ml-2 w-3 h-3" /></>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
