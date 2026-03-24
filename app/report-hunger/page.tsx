"use client";

import { useState } from "react";
import { postRequest } from "@/lib/apiClient";
import {
    MapPin, AlertTriangle, Send, CheckCircle2,
    User, Phone, Package, FileText, Loader2,
    Navigation, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useActivityBroadcast } from "@/hooks/useActivityBroadcast";

export default function ReportHungerPage() {
    const { broadcastActivity } = useActivityBroadcast();
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        locationName: "",
        address: "",
        quantity: "",
        description: "",
        urgency: "medium" as "low" | "medium" | "high",
        lat: null as number | null,
        lng: null as number | null,
    });

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            setError("Location not supported by your browser.");
            return;
        }
        setLocationLoading(true);
        setError("");
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await res.json();
                    const addr = data.display_name || "";
                    const city =
                        data.address?.city ||
                        data.address?.town ||
                        data.address?.village ||
                        "";
                    setFormData(prev => ({
                        ...prev,
                        lat: latitude,
                        lng: longitude,
                        address: addr,
                        locationName: prev.locationName || city,
                    }));
                } catch {
                    setFormData(prev => ({ ...prev, lat: latitude, lng: longitude }));
                } finally {
                    setLocationLoading(false);
                }
            },
            () => {
                setError("Location permission denied. Please enter your location manually.");
                setLocationLoading(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!formData.lat || !formData.lng) {
            setError("Please use the 'Detect My Location' button to set your location, or enter it manually.");
            return;
        }
        if (formData.phone.replace(/\D/g, "").length < 7) {
            setError("Please enter a valid phone number.");
            return;
        }
        setLoading(true);
        try {
            const res = await postRequest("/api/hunger-reports", formData);
            if (res.success) {
                // --- Feature 6: Real-time Activity Broadcast ---
                broadcastActivity({
                    type: "HUNGER_REPORT",
                    title: "Hunger Request Raised",
                    description: `A new request for ${formData.quantity} servings/kg at ${formData.locationName || 'nearby location'}`,
                    id: res.data?._id || ""
                });

                setSuccess(true);
            } else setError(res.message || "Something went wrong. Please try again.");
        } catch {
            setError("Failed to submit request. Please check your connection.");
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
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Request Submitted!</h1>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed">
                        Thank you! Your food request has been received. Nearby NGOs have been notified and will reach you as soon as possible.
                    </p>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <p className="text-emerald-700 text-xs font-bold">
                            📞 Make sure your phone <span className="font-black">{formData.phone}</span> is reachable. An NGO volunteer may call you.
                        </p>
                    </div>
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
            <div className="max-w-2xl mx-auto px-6 py-24">
                <div className="bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl border border-slate-200/60 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                        <Heart className="w-48 h-48 text-rose-500" />
                    </div>

                    <div className="relative z-10 space-y-8">
                        {/* Header */}
                        <div className="space-y-3">
                            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-rose-500/10 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-md">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Emergency Food Request</span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
                                Need <span className="text-rose-500">Food Help?</span>
                            </h1>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed">
                                Fill in this form and nearby NGOs will be notified immediately to bring food to your location.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name + Phone */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Field label="Your Name" icon={<User className="w-4 h-4" />} required>
                                    <input
                                        required
                                        placeholder="Full name"
                                        className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all text-sm font-semibold outline-none"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </Field>

                                <Field label="Phone Number" icon={<Phone className="w-4 h-4" />} required>
                                    <input
                                        required
                                        type="tel"
                                        placeholder="+91 9876543210"
                                        className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all text-sm font-semibold outline-none"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </Field>
                            </div>

                            {/* Quantity */}
                            <Field label="Food Quantity Needed (servings / kg)" icon={<Package className="w-4 h-4" />} required>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 20 (number of people or kg needed)"
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all text-sm font-semibold outline-none"
                                    value={formData.quantity}
                                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                />
                            </Field>

                            {/* Location */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span>Your Location <span className="text-rose-400">*</span></span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleDetectLocation}
                                        disabled={locationLoading}
                                        className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors disabled:opacity-50"
                                    >
                                        {locationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                                        <span>{locationLoading ? "Detecting..." : "Use My Location"}</span>
                                    </button>
                                </div>

                                {formData.lat && formData.lng && (
                                    <div className="flex items-center space-x-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                        <p className="text-xs text-emerald-700 font-semibold truncate">{formData.address || `${formData.lat.toFixed(4)}, ${formData.lng.toFixed(4)}`}</p>
                                    </div>
                                )}

                                <input
                                    required
                                    placeholder="Area / locality name (e.g. Gandhi Nagar, Sector 5)"
                                    className="w-full h-14 px-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all text-sm font-semibold outline-none"
                                    value={formData.locationName}
                                    onChange={e => setFormData({ ...formData, locationName: e.target.value })}
                                />
                            </div>

                            {/* Description */}
                            <Field label="Additional Details (optional)" icon={<FileText className="w-4 h-4" />}>
                                <textarea
                                    rows={3}
                                    placeholder="Any additional info — e.g. elderly people, children, special dietary needs..."
                                    className="w-full pt-4 pl-12 pr-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all text-sm font-semibold outline-none resize-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </Field>

                            {/* Urgency */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Urgency Level</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['low', 'medium', 'high'] as const).map(lvl => (
                                        <button
                                            key={lvl}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, urgency: lvl })}
                                            className={cn(
                                                "h-12 rounded-xl border-2 font-black uppercase tracking-widest text-[10px] transition-all",
                                                formData.urgency === lvl
                                                    ? lvl === 'high' ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-100"
                                                        : lvl === 'medium' ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100"
                                                            : "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100"
                                                    : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300"
                                            )}
                                        >
                                            {lvl === 'high' ? '🔴 High' : lvl === 'medium' ? '🟡 Medium' : '🟢 Low'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-start space-x-3 p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm font-semibold">{error}</span>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest shadow-xl shadow-rose-100 transition-all active:scale-[0.98] flex items-center justify-center space-x-3"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        <span>Request Food Help</span>
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper component for consistent field layout
function Field({ label, icon, required, children }: {
    label: string;
    icon: React.ReactNode;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                {icon}
                <span>{label}{required && <span className="text-rose-400 ml-0.5">*</span>}</span>
            </label>
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">{icon}</div>
                {children}
            </div>
        </div>
    );
}
