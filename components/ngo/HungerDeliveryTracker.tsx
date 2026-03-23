"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, MapPin, Navigation, Truck, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface HungerRequest {
    _id: string;
    name: string;
    phone: string;
    locationName: string;
    quantity: number;
    lat: number;
    lng: number;
}

const STEPS = [
    { key: "on_the_way", label: "On The Way", icon: Truck, desc: "You are heading to the location" },
    { key: "arrived", label: "Arrived", icon: MapPin, desc: "You have reached the location" },
    { key: "completed", label: "Delivered", icon: Star, desc: "Food has been delivered" },
];

export default function HungerDeliveryTracker({
    request,
    onComplete,
    onBack,
}: {
    request: HungerRequest;
    onComplete: () => void;
    onBack: () => void;
}) {
    const [currentStep, setCurrentStep] = useState(0);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    const handleNext = async () => {
        setUpdating(true);
        setError("");
        const status = STEPS[currentStep].key;
        try {
            const res = await fetch(`/api/hunger-reports/${request._id}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
                },
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (data.success) {
                if (currentStep >= STEPS.length - 1) {
                    setDone(true);
                    setTimeout(() => onComplete(), 2000);
                } else {
                    setCurrentStep(prev => prev + 1);
                }
            } else {
                setError(data.message || "Failed to update status.");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setUpdating(false);
        }
    };

    if (done) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-emerald-100 animate-bounce">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Delivery Complete!</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Thank you for making a difference. You&apos;ve helped {request.name} today!
                </p>
            </div>
        );
    }

    const openDirections = () => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${request.lat},${request.lng}&travelmode=driving`;
        window.open(url, "_blank");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-3">
                <button
                    onClick={onBack}
                    className="w-9 h-9 rounded-xl border-2 border-slate-200 flex items-center justify-center hover:border-primary hover:text-primary transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Delivery Tracker</h2>
                    <p className="text-xs text-slate-400">Delivering to {request.name} — {request.locationName}</p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
                {STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const isCompleted = idx < currentStep;
                    const isActive = idx === currentStep;
                    return (
                        <div key={step.key} className="flex items-start space-x-4">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all",
                                isCompleted ? "bg-emerald-500 border-emerald-500 text-white"
                                    : isActive ? "bg-primary border-primary text-white"
                                        : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400"
                            )}>
                                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 pt-1">
                                <p className={cn(
                                    "text-sm font-black",
                                    isActive ? "text-primary" : isCompleted ? "text-emerald-600" : "text-slate-400"
                                )}>{step.label}</p>
                                <p className="text-xs text-slate-400 font-medium">{step.desc}</p>
                            </div>
                            {isCompleted && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-1.5 flex-shrink-0" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Quick info */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-1">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Recipient</p>
                    <p className="font-black text-slate-900 dark:text-white text-sm">{request.name}</p>
                    <p className="text-xs text-slate-500">{request.phone}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-1">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Quantity</p>
                    <p className="font-black text-slate-900 dark:text-white text-sm">{request.quantity} servings</p>
                    <p className="text-xs text-slate-500">{request.locationName}</p>
                </div>
            </div>

            {/* Map link */}
            <button
                onClick={openDirections}
                className="w-full flex items-center justify-center space-x-2 h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-wider hover:border-primary hover:text-primary transition-all"
            >
                <Navigation className="w-4 h-4" />
                <span>Open in Google Maps</span>
            </button>

            {error && (
                <p className="text-xs text-rose-500 font-semibold text-center">{error}</p>
            )}

            {/* CTA */}
            <button
                onClick={handleNext}
                disabled={updating}
                className={cn(
                    "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-white flex items-center justify-center space-x-2 transition-all active:scale-[0.98]",
                    currentStep >= STEPS.length - 1
                        ? "bg-emerald-500 hover:bg-emerald-600"
                        : "bg-primary hover:bg-primary/90"
                )}
            >
                {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                        <span>
                            {currentStep === 0 ? "I'm On My Way"
                                : currentStep === 1 ? "I've Arrived"
                                    : "Mark as Delivered"}
                        </span>
                    </>
                )}
            </button>
        </div>
    );
}
