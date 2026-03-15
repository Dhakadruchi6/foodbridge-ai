"use client";

import { useState } from "react";
import { postRequest } from "@/lib/apiClient";
import { CheckCircle2, Truck, Package, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DeliveryStatus = "assigned" | "picked_up" | "completed";

interface StatusStep {
    key: DeliveryStatus;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    color: string;
}

const steps: StatusStep[] = [
    {
        key: "assigned",
        label: "Accepted",
        sublabel: "NGO has confirmed the donation",
        icon: <CheckCircle2 className="w-5 h-5" />,
        color: "bg-indigo-50 text-indigo-600 border-indigo-200",
    },
    {
        key: "picked_up",
        label: "Pickup In Progress",
        sublabel: "Team is heading to pickup location",
        icon: <Truck className="w-5 h-5" />,
        color: "bg-amber-50 text-amber-600 border-amber-200",
    },
    {
        key: "completed",
        label: "Delivered to Beneficiaries",
        sublabel: "Food successfully distributed",
        icon: <Package className="w-5 h-5" />,
        color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
];

const nextStatus: Record<DeliveryStatus, DeliveryStatus | null> = {
    assigned: "picked_up",
    picked_up: "completed",
    completed: null,
};

const nextLabel: Record<DeliveryStatus, string> = {
    assigned: "Mark Pickup In Progress",
    picked_up: "Mark Delivered",
    completed: "Mission Complete",
};

export const DeliveryStatusUpdater = ({
    deliveryId,
    currentStatus,
    onStatusUpdate,
}: {
    deliveryId: string;
    currentStatus: DeliveryStatus;
    onStatusUpdate?: (newStatus: DeliveryStatus) => void;
}) => {
    const [status, setStatus] = useState<DeliveryStatus>(currentStatus);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const currentStepIdx = steps.findIndex(s => s.key === status);

    const handleUpdate = async () => {
        const next = nextStatus[status];
        if (!next) return;

        setLoading(true);
        setError("");
        try {
            const result = await postRequest("/api/donations/update-status", {
                deliveryId,
                status: next,
            });
            if (result.success) {
                setStatus(next);
                setSuccess(`Status updated to "${steps.find(s => s.key === next)?.label}"!`);
                setTimeout(() => setSuccess(""), 3000);
                onStatusUpdate?.(next);
            } else {
                setError(result.message || "Update failed");
            }
        } catch (err: any) {
            setError(err.message || "Failed to update status");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivery Status</p>

            {/* Timeline */}
            <div className="space-y-3">
                {steps.map((step, idx) => {
                    const isDone = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;

                    return (
                        <div key={step.key} className="flex items-center space-x-3">
                            <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center border transition-all shrink-0",
                                isDone ? step.color : "bg-slate-50 text-slate-300 border-slate-100",
                                isCurrent && "ring-2 ring-offset-1 ring-primary/30"
                            )}>
                                {step.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                    "text-xs font-black uppercase tracking-widest",
                                    isDone ? "text-slate-900" : "text-slate-400"
                                )}>{step.label}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{step.sublabel}</p>
                            </div>
                            {isCurrent && (
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                            )}
                            {isDone && !isCurrent && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Error/Success */}
            {error && <p className="text-[11px] text-rose-600 font-bold">{error}</p>}
            {success && <p className="text-[11px] text-emerald-600 font-bold">{success}</p>}

            {/* Action Button */}
            {nextStatus[status] ? (
                <Button
                    onClick={handleUpdate}
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center space-x-2"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <span>{nextLabel[status]}</span>
                            <ChevronRight className="w-4 h-4" />
                        </>
                    )}
                </Button>
            ) : (
                <div className="flex items-center justify-center p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" />
                    <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Mission Complete</span>
                </div>
            )}
        </div>
    );
};
