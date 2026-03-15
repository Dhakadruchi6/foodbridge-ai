"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Package, Clock, CheckCircle2, Search, MapPin, Activity, ArrowUpDown, ExternalLink } from "lucide-react";

interface Donation {
    _id: string;
    foodType: string;
    quantity: number;
    status: "pending" | "accepted" | "picked_up" | "delivered";
    city: string;
    createdAt: string;
    prioritizationRank?: number;
    donorId: { name: string; email: string } | null;
    latitude?: number | null;
    longitude?: number | null;
}

const statusStyle: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-100/50",
    accepted: "bg-indigo-50 text-indigo-700 border-indigo-100/50",
    picked_up: "bg-blue-50 text-blue-700 border-blue-100/50",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-100/50",
};

const statusLabel: Record<string, string> = {
    pending: "Awaiting",
    accepted: "Matched",
    picked_up: "Transit",
    delivered: "Success",
};

export const DonationTable = ({ donations }: { donations: Donation[] }) => {
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    const filtered = donations
        .filter((d) => {
            const searchLower = search.toLowerCase();
            const matchesSearch =
                (d.foodType || "").toLowerCase().includes(searchLower) ||
                (d.donorId?.name || "").toLowerCase().includes(searchLower) ||
                (d.city || "").toLowerCase().includes(searchLower);
            const matchesStatus = filterStatus === "all" || d.status === filterStatus;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => (b.prioritizationRank || 0) - (a.prioritizationRank || 0));

    const getPriorityColor = (score: number) => {
        if (score >= 80) return "bg-rose-50 text-rose-600 border-rose-100";
        if (score >= 50) return "bg-amber-50 text-amber-600 border-amber-100";
        return "text-slate-400 bg-slate-50 border-slate-100";
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-2 bg-slate-100/50 p-1 rounded-xl border border-slate-200/40">
                    {["all", "pending", "accepted", "picked_up", "delivered"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                filterStatus === s ? "bg-white shadow-sm text-slate-900 border border-slate-200/30" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {s === "picked_up" ? "Transit" : s}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search assets..."
                        className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 w-64 bg-white"
                    />
                </div>
            </div>

            <div className="rounded-xl border border-slate-200/60 overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200/60 bg-slate-50/50">
                            <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Asset</th>
                            <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Source Entity</th>
                            <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Payload</th>
                            <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Location</th>
                            <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center">Priority <ArrowUpDown className="w-3 h-3 ml-2 opacity-30" /></th>
                            <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center">
                                        <Package className="w-8 h-8 text-slate-200 mb-2" />
                                        <p className="text-slate-400 font-bold text-sm tracking-tight">Zero matches found in current ledger.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((donation) => (
                                <tr key={donation._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                                <Package className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <span className="font-black text-slate-900 tracking-tight">{donation.foodType || "—"}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-bold text-slate-700 leading-tight">{donation.donorId?.name || "—"}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{donation.donorId?.email || ""}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-black text-slate-600 italic">{donation.quantity}kg</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="flex items-center text-slate-500 font-bold text-xs uppercase tracking-tighter">
                                                <MapPin className="w-3 h-3 mr-1 text-slate-300" />{donation.city}
                                            </span>
                                            {donation.latitude && donation.longitude && (
                                                <a
                                                    href={`https://www.google.com/maps?q=${donation.latitude},${donation.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-[9px] font-black text-primary hover:underline mt-1 uppercase tracking-widest"
                                                >
                                                    <ExternalLink className="w-2.5 h-2.5 mr-1" />
                                                    View Map
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-black tabular-nums",
                                            getPriorityColor(donation.prioritizationRank || 0)
                                        )}>
                                            <Activity className="w-2.5 h-2.5 mr-1.5 opacity-60" />
                                            {Math.round(donation.prioritizationRank || 0)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest",
                                            statusStyle[donation.status] || statusStyle.pending
                                        )}>
                                            {statusLabel[donation.status] || donation.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
