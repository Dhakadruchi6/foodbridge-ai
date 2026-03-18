"use client";

import { useEffect, useState, Suspense } from "react";
import { getRequest } from "@/lib/apiClient";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ActiveDeliveries } from "@/components/ngo/ActiveDeliveries";
import { DeliveryStatusUpdater } from "@/components/ngo/DeliveryStatusUpdater";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    BarChart3,
    Package,
    Truck,
    History,
    ShieldCheck,
    Zap,
    Activity,
    MapPin,
    User,
    Phone,
    Navigation
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function LogisticsDashboardContent() {
    const [stats, setStats] = useState<any>(null);
    const searchParams = useSearchParams();
    const deliveryId = searchParams?.get("deliveryId");
    const donationId = searchParams?.get("donationId");

    const [deliveryDetails, setDeliveryDetails] = useState<any>(null);

    useEffect(() => {
        if (deliveryId || donationId) {
            getRequest("/api/donations/my-deliveries")
                .then(res => {
                    if (res.success) {
                        const target = res.data.find((d: any) =>
                            (deliveryId && d._id === deliveryId) ||
                            (donationId && (d.donationId?._id === donationId || d.donationId === donationId))
                        );
                        if (target) setDeliveryDetails(target);
                    }
                }).catch(() => { });
        }
    }, [deliveryId, donationId]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const result = await getRequest("/api/analytics/summary");
                if (result.success) setStats(result.data);
            } catch (err) {
                console.error("Failed to fetch logistics stats", err);
            }
        };
        fetchStats();
    }, []);

    return (
        <ProtectedRoute allowedRoles={["ngo"]}>
            <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">

                {/* Navigation Wrapper */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/dashboard/ngo"
                        className="group flex items-center space-x-3 text-slate-400 hover:text-primary transition-all duration-300"
                    >
                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5">
                            <ArrowLeft className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">Back to Mission Discovery</span>
                    </Link>

                    <div className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                        <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">Intelligence Feed Live</span>
                    </div>
                </div>

                {/* Hero Section */}
                <div className="space-y-4">
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none">
                        Logistics <span className="text-indigo-600">Overview</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-lg max-w-xl">
                        Monitor your fleet performance, track active missions, and analyze recovery efficiency in real-time.
                    </p>
                </div>

                {/* Detailed Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="glass-card rounded-[2.5rem] border-none bg-white p-2">
                        <CardContent className="p-8 space-y-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-4xl font-black text-slate-900 block tracking-tighter">{stats ? `${stats.successRate}%` : "---"}</span>
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Mission Success Rate</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card rounded-[2.5rem] border-none bg-white p-2">
                        <CardContent className="p-8 space-y-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                <Package className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-4xl font-black text-slate-900 block tracking-tighter">{stats ? `${stats.totalRecovered}kg` : "---"}</span>
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Total Food Recovered</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card rounded-[2.5rem] border-none bg-white p-2">
                        <CardContent className="p-8 space-y-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <Truck className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-4xl font-black text-slate-900 block tracking-tighter">{stats ? stats.activeMissions : "---"}</span>
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Active Missions</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Active Fleet View / Single Delivery Detail */}
                    <div className="lg:col-span-2 space-y-8">
                        {(!deliveryId && !donationId) ? (
                            <>
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                            <Activity className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Fleet Control</h2>
                                    </div>
                                </div>
                                <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform duration-1000 group-hover:rotate-0">
                                        <Zap className="w-64 h-64 text-indigo-400" />
                                    </div>
                                    <div className="relative z-10">
                                        <ActiveDeliveries variant="dark" />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Mission Control</h2>
                                    </div>
                                    <Link href="/dashboard/ngo/logistics" className="text-xs font-black uppercase text-indigo-600 hover:text-indigo-700 tracking-widest bg-indigo-50 px-4 py-2 rounded-xl">
                                        View All
                                    </Link>
                                </div>

                                {deliveryDetails ? (
                                    <div className="p-10 rounded-[3rem] bg-white border border-slate-200 shadow-xl overflow-hidden relative group">
                                        <div className="space-y-8 relative z-10">
                                            {/* Mission Details */}
                                            <div className="pb-8 border-b border-slate-100">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                                                    {/* Payload & Zone */}
                                                    <div className="space-y-4">
                                                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Operational Payload</span>
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                                                    <Package className="w-5 h-5" />
                                                                </div>
                                                                <span className="text-2xl font-black text-slate-900">{deliveryDetails.donationId?.quantity}kg</span>
                                                            </div>
                                                        </div>

                                                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Target Extraction Zone</span>
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                                                    <MapPin className="w-5 h-5" />
                                                                </div>
                                                                <span className="text-lg font-bold text-slate-700">{deliveryDetails.donationId?.city}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Donor & Navigation */}
                                                    <div className="space-y-4">
                                                        <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-600/20 relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 p-4 opacity-10"><User className="w-16 h-16" /></div>
                                                            <div className="relative z-10">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200 block mb-3">Donor Information</span>
                                                                <p className="text-xl font-black">{deliveryDetails.donationId?.donorId?.name || "Private Donor"}</p>
                                                                {deliveryDetails.donationId?.donorId?.phone && (
                                                                    <a
                                                                        href={`tel:${deliveryDetails.donationId.donorId.phone}`}
                                                                        className="inline-flex items-center mt-2 text-indigo-100 hover:text-white transition-colors space-x-2"
                                                                    >
                                                                        <Phone className="w-3.5 h-3.5" />
                                                                        <span className="text-xs font-bold underline decoration-indigo-300 decoration-2 underline-offset-4">{deliveryDetails.donationId.donorId.phone}</span>
                                                                    </a>
                                                                )}
                                                                <p className="text-[10px] text-indigo-200 mt-4 font-bold flex items-center">
                                                                    <MapPin className="w-3 h-3 mr-1.5 shrink-0" />
                                                                    {deliveryDetails.donationId?.pickupAddress}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {deliveryDetails.donationId?.latitude && deliveryDetails.donationId?.longitude && (
                                                            <a
                                                                href={`https://www.google.com/maps/dir/?api=1&destination=${deliveryDetails.donationId.latitude},${deliveryDetails.donationId.longitude}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl flex items-center justify-center space-x-3 transition-all active:scale-[0.98] shadow-xl shadow-slate-900/10 group"
                                                            >
                                                                <Navigation className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform" />
                                                                <span className="text-xs font-black uppercase tracking-[0.2em]">Launch Precision Nav</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Updater */}
                                            <div>
                                                <h4 className="text-lg font-black text-slate-900 mb-4">Update Mission Status</h4>
                                                <DeliveryStatusUpdater
                                                    deliveryId={deliveryDetails._id}
                                                    donationId={deliveryDetails.donationId?._id || deliveryDetails.donationId}
                                                    currentStatus={deliveryDetails.status}
                                                    onStatusUpdate={(newS) => setDeliveryDetails({ ...deliveryDetails, status: newS })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-400 font-bold">
                                        Loading mission data...
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Mission History / Insights */}
                    <div className="space-y-10">
                        <div className="glass-card p-10 rounded-[2.5rem] border-none bg-slate-50 space-y-8">
                            <div className="flex items-center space-x-3">
                                <History className="w-6 h-6 text-slate-800" />
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Insights</h3>
                            </div>

                            <div className="space-y-6">
                                <HistoryItem
                                    title="Route Optimized"
                                    desc="Updated Jalandhar sector routes saving 4km per trip."
                                    time="2h ago"
                                />
                                <HistoryItem
                                    title="Compliance Secured"
                                    desc="All temperature logs for today's batches verified."
                                    time="5h ago"
                                />
                                <HistoryItem
                                    title="New Region Open"
                                    desc="Expanded operational zone to include Ludhiana North."
                                    time="Yesterday"
                                />
                            </div>

                            <div className="pt-4 mt-4 border-t border-slate-200">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Data Sovereignty</p>
                                        <p className="text-[10px] font-bold text-slate-400 tracking-tighter">Encrypted Operations</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </ProtectedRoute>
    );
}

export default function LogisticsDashboard() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading logistics module...</div>}>
            <LogisticsDashboardContent />
        </Suspense>
    );
}


const HistoryItem = ({ title, desc, time }: { title: string; desc: string; time: string }) => (
    <div className="space-y-2 border-l-2 border-slate-200 pl-6 relative">
        <div className="absolute w-2 h-2 rounded-full bg-slate-400 -left-[5px] top-1.5" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{time}</span>
        <p className="text-sm font-black text-slate-800 leading-none">{title}</p>
        <p className="text-xs font-bold text-slate-500 leading-relaxed">{desc}</p>
    </div>
);
