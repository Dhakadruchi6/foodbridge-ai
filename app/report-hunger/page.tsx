"use client";

import { useState } from "react";
import { postRequest } from "@/lib/apiClient";
import { MapPin, Users, AlertTriangle, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ReportHungerPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        locationName: "",
        peopleCount: "",
        urgency: "medium",
        lat: 37.7749, // Default to SF for demo
        lng: -122.4194
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await postRequest("/api/hunger-reports", formData);
            if (res.success) setSuccess(true);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen saas-gradient flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-[2.5rem] p-12 text-center space-y-6 shadow-2xl border border-emerald-100">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-100 animate-bounce">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Report Logged</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-tight text-xs leading-relaxed">
                        Thank you for your contribution. Verified NGOs in this sector have been alerted and will respond based on protocol.
                    </p>
                    <Button
                        onClick={() => window.location.href = "/"}
                        className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest"
                    >
                        Return Home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen saas-gradient">
            <div className="max-w-3xl mx-auto px-6 py-24">
                <div className="bg-white rounded-[3rem] p-12 md:p-16 shadow-2xl border border-slate-200/60 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                        <AlertTriangle className="w-48 h-48 text-rose-500" />
                    </div>

                    <div className="relative z-10 space-y-10">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <div className="px-3 py-1 bg-rose-500/10 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-md flex items-center">
                                    <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> High Urgency Portal
                                </div>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none uppercase">
                                Report <span className="text-rose-500">Hunger Spot</span>
                            </h1>
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest max-w-lg">
                                Help NGOs prioritize food rescue by reporting locations where food is urgently needed.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-4">Location Name</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                                    <input
                                        required
                                        placeholder="e.g. Town Square Slum"
                                        className="w-full h-16 pl-14 pr-6 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold tracking-tight outline-none"
                                        value={formData.locationName}
                                        onChange={e => setFormData({ ...formData, locationName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-4">Estimated People</label>
                                <div className="relative group">
                                    <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                                    <input
                                        required
                                        type="number"
                                        placeholder="e.g. 50"
                                        className="w-full h-16 pl-14 pr-6 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold tracking-tight outline-none"
                                        value={formData.peopleCount}
                                        onChange={e => setFormData({ ...formData, peopleCount: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="col-span-full space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-4">Urgency Level</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {['low', 'medium', 'high'].map(lvl => (
                                        <button
                                            key={lvl}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, urgency: lvl })}
                                            className={cn(
                                                "h-14 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] transition-all",
                                                formData.urgency === lvl
                                                    ? (lvl === 'high' ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200" :
                                                        lvl === 'medium' ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-200" :
                                                            "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200")
                                                    : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200"
                                            )}
                                        >
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="col-span-full pt-8">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-16 rounded-[1.5rem] bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.25em] shadow-2xl transition-all active:scale-95 flex items-center justify-center space-x-3"
                                >
                                    <Send className={cn("w-5 h-5", loading && "animate-pulse")} />
                                    <span>{loading ? "Transmitting..." : "Submit Intelligence Report"}</span>
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
