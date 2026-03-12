"use client";

import { Users, Package, TrendingUp, CheckCircle2, Building2, ShieldCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricsCardsProps {
    metrics: {
        totalUsers: number;
        totalDonors: number;
        totalNGOs: number;
        totalDonations: number;
        successfulDeliveries: number;
    } | null;
}

const cards = [
    { key: "totalUsers", label: "Total Users", icon: Users, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
    { key: "totalDonors", label: "Active Donors", icon: Package, color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100" },
    { key: "totalNGOs", label: "Registered NGOs", icon: Building2, color: "text-violet-500", bg: "bg-violet-50", border: "border-violet-100" },
    { key: "totalDonations", label: "Total Donations", icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
    { key: "successfulDeliveries", label: "Deliveries Completed", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
];

export const MetricsCards = ({ metrics }: MetricsCardsProps) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {cards.map((card) => {
                const Icon = card.icon;
                const value = metrics ? (metrics as any)[card.key] : null;
                return (
                    <div
                        key={card.key}
                        className={cn(
                            "relative p-6 rounded-[2rem] border bg-white group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden",
                            card.border
                        )}
                    >
                        {/* Background glow */}
                        <div className={cn("absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-xl", card.bg)} />

                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm", card.bg)}>
                            <Icon className={cn("w-6 h-6", card.color)} />
                        </div>
                        <div className="space-y-1 relative z-10">
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">
                                {value !== null ? value.toLocaleString() : (
                                    <span className="inline-block w-16 h-8 bg-slate-100 rounded-lg animate-pulse" />
                                )}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
