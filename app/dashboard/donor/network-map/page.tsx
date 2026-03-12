"use client";

import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import Link from "next/link";
import {
    ArrowLeft,
    Map as MapIcon,
    Globe2,
    Activity,
    ChevronRight,
    Radar,
    Zap,
    ShieldCheck,
    Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NetworkMapPage() {
    return (
        <ProtectedRoute allowedRoles={["donor"]}>
            <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/dashboard/donor"
                        className="group flex items-center space-x-3 text-slate-400 hover:text-primary transition-all duration-300"
                    >
                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5">
                            <ArrowLeft className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">Return to Command Center</span>
                    </Link>

                    <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                        <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Global Network Active</span>
                    </div>
                </div>

                {/* Hero Section */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-none">
                            Network <span className="text-primary">Intelligence</span>
                        </h1>
                        <p className="text-slate-500 font-bold text-lg max-w-xl leading-relaxed">
                            Stylized visualization of active recovery hubs, logistics clusters, and cross-organization mission synergy.
                        </p>
                    </div>
                </div>

                {/* Stylized Visual Representation of "Network" */}
                <div className="relative aspect-[21/9] w-full bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border border-slate-800">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

                    {/* Animated Grids */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

                    {/* Central Pulsing Radar */}
                    <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="relative">
                            <div className="absolute inset-0 w-80 h-80 -translate-x-1/2 -translate-y-1/2 bg-primary/10 rounded-full animate-ping duration-1000" />
                            <div className="absolute inset-0 w-48 h-48 -translate-x-1/2 -translate-y-1/2 bg-primary/20 rounded-full border border-primary/30 animate-pulse" />
                            <div className="w-4 h-4 bg-primary rounded-full shadow-[0_0_20px_rgba(37,99,235,0.8)] relative z-10" />
                        </div>
                    </div>

                    {/* Floated Activity Nodes */}
                    <ActivityNode x="20%" y="30%" name="SF Hub" label="Active Recovery" />
                    <ActivityNode x="75%" y="25%" name="Logistics Cluster" label="3 Missions" color="indigo" />
                    <ActivityNode x="85%" y="60%" name="NGO HQ" label="Verified" color="emerald" />
                    <ActivityNode x="15%" y="70%" name="Donor Node" label="Surplus Ready" color="amber" />

                    {/* Connection Lines (VFX) */}
                    <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <line x1="20" y1="30" x2="50" y2="50" stroke="white" strokeWidth="0.1" strokeDasharray="1 1" />
                        <line x1="75" y1="25" x2="50" y2="50" stroke="white" strokeWidth="0.1" strokeDasharray="1 1" />
                        <line x1="85" y1="60" x2="50" y2="50" stroke="white" strokeWidth="0.1" strokeDasharray="1 1" />
                        <line x1="15" y1="70" x2="50" y2="50" stroke="white" strokeWidth="0.1" strokeDasharray="1 1" />
                    </svg>

                    {/* Operational Overlays */}
                    <div className="absolute bottom-10 left-10 p-6 glass-card bg-white/5 border-white/10 text-white rounded-3xl backdrop-blur-xl space-y-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary/20 rounded-lg"><Radar className="w-5 h-5 text-primary" /></div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scanning Precision</p>
                                <p className="text-sm font-bold">Optimal Signal Strength</p>
                            </div>
                        </div>
                    </div>

                    <div className="absolute top-10 right-10 p-6 glass-card bg-white/5 border-white/10 text-white rounded-3xl backdrop-blur-xl">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-10">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Nodes</span>
                                <span className="text-xs font-black">1.2k</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="w-[70%] h-full bg-primary" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <InsightCard title="Synergy Match" desc="Cross-donor surplus batch consolidation optimized by AI." icon={<Zap className="w-5 h-5" />} />
                    <InsightCard title="Verified Integrity" desc="Continuous compliance monitoring across all grid nodes." icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />} />
                    <InsightCard title="Logistics Reach" desc="Expanding operational zones to cover high-need urban centers." icon={<Globe2 className="w-5 h-5 text-blue-500" />} />
                </div>
            </div>
        </ProtectedRoute>
    );
}

const ActivityNode = ({ x, y, name, label, color = "primary" }: any) => {
    const colors: any = {
        primary: "bg-primary shadow-primary/50",
        indigo: "bg-indigo-500 shadow-indigo-500/50",
        emerald: "bg-emerald-500 shadow-emerald-500/50",
        amber: "bg-amber-500 shadow-amber-500/50"
    };

    return (
        <div
            className="absolute flex items-center group cursor-crosshair transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: x, top: y }}
        >
            <div className={cn("w-3 h-3 rounded-full shadow-lg relative z-20 transition-all duration-500 group-hover:scale-150", colors[color])} />
            <div className="ml-4 p-3 glass-card bg-white/5 border-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0 pointer-events-none">
                <p className="text-xs font-black text-white whitespace-nowrap leading-none mb-1">{name}</p>
                <p className="text-[9px] font-bold text-slate-400 whitespace-nowrap leading-none uppercase tracking-tighter">{label}</p>
            </div>
        </div>
    );
};

const InsightCard = ({ title, desc, icon }: any) => (
    <div className="p-8 glass-card rounded-[2.5rem] border-slate-100 hover:shadow-xl transition-all duration-300 group">
        <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-primary/5 transition-colors">{icon}</div>
            <h4 className="text-lg font-black text-slate-900 tracking-tight">{title}</h4>
        </div>
        <p className="text-sm font-bold text-slate-500 leading-relaxed">{desc}</p>
    </div>
);
