"use client";

import * as React from "react";
import { postRequest } from "@/lib/apiClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Phone,
    MapPin,
    Globe,
    Navigation,
    Building2,
    Heart,
    Loader2,
    ShieldCheck,
    CheckCircle2,
    ArrowRight,
    AlertCircle,
    User as UserIcon,
    Mail,
    FileText
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { saveToken } from "@/lib/auth";

export default function CompleteProfilePage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        }>
            <CompleteProfileContent />
        </React.Suspense>
    );
}

function CompleteProfileContent() {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryRole = searchParams.get("role");

    const [formData, setFormData] = React.useState({
        name: "",
        email: "",
        phone: "",
        city: "",
        state: "",
        address: "",
        pincode: "",
        role: queryRole === "ngo" ? "ngo" : "donor",
        ngoRegNo: "",
        description: "",
        donationPreferences: "",
        latitude: null as number | null,
        longitude: null as number | null
    });
    const [otp, setOtp] = React.useState("");
    const [isOtpSent, setIsOtpSent] = React.useState(false);
    const [isPhoneVerified, setIsPhoneVerified] = React.useState(false);
    const [otpLoading, setOtpLoading] = React.useState(false);
    const [locationLoading, setLocationLoading] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [isActivated, setIsActivated] = React.useState(false);
    const [error, setError] = React.useState("");

    // Pre-fill Google data and handle auto-redirect if profile is already complete
    React.useEffect(() => {
        if (session === undefined) return; // Wait for session to load

        if (session?.user) {
            // Check if profile is already complete - if so, skip this page
            if (session.user.isProfileComplete) {
                // Bridge token if missing
                if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
                    saveToken(`social-${session.user.id}`);
                }
                router.replace(`/dashboard/${session.user.role || 'donor'}`);
                return;
            }

            setFormData(prev => ({
                ...prev,
                name: session.user.name || prev.name,
                email: session.user.email || prev.email,
                role: queryRole === "ngo" ? "ngo" : (session.user.role || prev.role)
            }));
        }
    }, [session, router, queryRole]);

    const handleSendOtp = async () => {
        if (!formData.phone) return;
        setOtpLoading(true);
        try {
            const res = await postRequest("/api/auth/send-otp", { phone: formData.phone });
            if (res.success) {
                setIsOtpSent(true);
                setError("");
            }
        } catch (err: any) {
            setError(err.message || "Failed to send OTP");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setOtpLoading(true);
        try {
            const res = await postRequest("/api/auth/verify-otp", { phone: formData.phone, otp });
            if (res.success) {
                setIsPhoneVerified(true);
                setIsOtpSent(false);
            }
        } catch (err: any) {
            setError(err.message || "Invalid OTP");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({ ...prev, latitude, longitude }));

                try {
                    // Reverse geocoding using Nominatim (free, no key required for low traffic)
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();

                    if (data && data.address) {
                        setFormData(prev => ({
                            ...prev,
                            address: data.display_name || prev.address,
                            city: data.address.city || data.address.town || data.address.village || prev.city,
                            state: data.address.state || prev.state,
                            pincode: data.address.postcode || prev.pincode
                        }));
                    }
                } catch (err) {
                    console.error("Reverse geocoding error:", err);
                    // Fallback: just keep coords
                } finally {
                    setLocationLoading(false);
                }
            },
            (err) => {
                setError("Failed to get location. Please allow location permissions.");
                setLocationLoading(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPhoneVerified) {
            setError("Please verify your phone number first.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await postRequest("/api/auth/complete-profile", {
                ...formData,
                email: session?.user?.email
            });
            if (res.success) {
                // CRITICAL: Bridge legacy token system for middleware/protection compatibility
                if (typeof window !== 'undefined') {
                    saveToken(`social-${session?.user?.id || 'new-oauth'}`);
                    localStorage.setItem('role', formData.role);
                }

                setIsActivated(true);
                // Force a hard redirect after a short delay to allow background sync
                setTimeout(() => {
                    window.location.href = `/dashboard/${formData.role}`;
                }, 1000);
            }
        } catch (err: any) {
            setError(err.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-20 px-6">
            <div className="max-w-2xl mx-auto space-y-10">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-white shadow-xl mb-2">
                        {isActivated ? (
                            <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce" />
                        ) : (
                            <ShieldCheck className="w-10 h-10 text-blue-600" />
                        )}
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        {isActivated ? "Account Activated!" : "Complete Your Identity"}
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                        {isActivated ? "Synchronizing your secure connection..." : "Unlock access by providing your operational details"}
                    </p>
                </div>

                <div className="glass-card rounded-[3rem] bg-white p-12 shadow-2xl space-y-10">
                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* Role Selection */}
                        <div className="grid grid-cols-2 gap-6">
                            <RoleChoice
                                active={formData.role === "donor"}
                                onClick={() => setFormData({ ...formData, role: "donor" })}
                                icon={<Heart className="w-5 h-5" />}
                                title="Donor"
                            />
                            <RoleChoice
                                active={formData.role === "ngo"}
                                onClick={() => setFormData({ ...formData, role: "ngo" })}
                                icon={<Building2 className="w-5 h-5" />}
                                title="NGO Partner"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Name & Email (Pre-filled from Google) */}
                            <InputField
                                label="Full Name"
                                icon={<UserIcon className="w-4 h-4" />}
                                placeholder="Your Name"
                                value={formData.name}
                                onChange={(val: string) => setFormData({ ...formData, name: val })}
                            />
                            <InputField
                                label="Email Address"
                                icon={<Mail className="w-4 h-4" />}
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={(val: string) => setFormData({ ...formData, email: val })}
                                disabled={true}
                            />

                            <InputField
                                label="Verified Phone"
                                icon={<Phone className="w-4 h-4" />}
                                value={formData.phone}
                                onChange={(v: string) => setFormData({ ...formData, phone: v })}
                                placeholder="+1 555-0100"
                                action={!isPhoneVerified && (
                                    <button type="button" onClick={handleSendOtp} className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                        {otpLoading ? "..." : "Send OTP"}
                                    </button>
                                )}
                            />

                            <InputField label="Base City" icon={<Globe className="w-4 h-4" />} value={formData.city} onChange={(v: string) => setFormData({ ...formData, city: v })} placeholder="San Francisco" />

                            {formData.role === 'ngo' && (
                                <div className="md:col-span-2 animate-in slide-in-from-top duration-300 space-y-8">
                                    <InputField
                                        label="NGO Registration Number"
                                        icon={<FileText className="w-4 h-4" />}
                                        placeholder="Reg No. (e.g. 12345/2024)"
                                        value={formData.ngoRegNo}
                                        onChange={(val: string) => setFormData({ ...formData, ngoRegNo: val })}
                                    />
                                    <InputField
                                        label="Organization Description"
                                        icon={<Heart className="w-4 h-4" />}
                                        placeholder="Our mission is to..."
                                        value={formData.description}
                                        onChange={(val: string) => setFormData({ ...formData, description: val })}
                                    />
                                </div>
                            )}

                            {formData.role === 'donor' && (
                                <div className="md:col-span-2 animate-in slide-in-from-top duration-300">
                                    <InputField
                                        label="Donation Preferences"
                                        icon={<Heart className="w-4 h-4" />}
                                        placeholder="e.g. Surplus food, fresh produce, bulk items..."
                                        value={formData.donationPreferences}
                                        onChange={(val: string) => setFormData({ ...formData, donationPreferences: val })}
                                    />
                                </div>
                            )}

                            {isOtpSent && !isPhoneVerified && (
                                <div className="md:col-span-2">
                                    <InputField
                                        label="OTP Code"
                                        icon={<ShieldCheck className="w-4 h-4" />}
                                        value={otp}
                                        onChange={setOtp}
                                        placeholder="000000"
                                        action={<button type="button" onClick={handleVerifyOtp} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Verify</button>}
                                    />
                                </div>
                            )}

                            {isPhoneVerified && (
                                <div className="md:col-span-2 p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex items-center space-x-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Identity Verified</span>
                                </div>
                            )}

                            <InputField label="State" icon={<MapPin className="w-4 h-4" />} value={formData.state} onChange={(v: string) => setFormData({ ...formData, state: v })} placeholder="California" />
                            <InputField label="Zip / Pincode" icon={<Navigation className="w-4 h-4" />} value={formData.pincode} onChange={(v: string) => setFormData({ ...formData, pincode: v })} placeholder="94103" />

                            <div className="md:col-span-2">
                                <InputField
                                    label="Operational Address"
                                    icon={<MapPin className="w-4 h-4" />}
                                    value={formData.address}
                                    onChange={(v: string) => setFormData({ ...formData, address: v })}
                                    placeholder="123 Sustainability Ave..."
                                    action={
                                        <button
                                            type="button"
                                            onClick={handleGetLocation}
                                            disabled={locationLoading}
                                            className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest disabled:opacity-50"
                                        >
                                            {locationLoading ? "Fetching..." : "Get Live Location"}
                                        </button>
                                    }
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex items-center space-x-3 italic">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm font-bold">{error}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading || !isPhoneVerified}
                            className="w-full h-16 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white text-xl font-black shadow-2xl shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:grayscale disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><span>Activate Account</span> <ArrowRight className="w-6 h-6" /></>}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

const RoleChoice = ({ active, onClick, icon, title }: any) => (
    <button type="button" onClick={onClick} className={cn("p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center space-y-2", active ? "bg-blue-50 border-blue-600 shadow-xl" : "bg-slate-50 border-slate-100 hover:border-slate-200")}>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", active ? "bg-blue-600 text-white" : "bg-white text-slate-400")}>{icon}</div>
        <span className={cn("text-xs font-black uppercase tracking-widest", active ? "text-slate-900" : "text-slate-500")}>{title}</span>
    </button>
);

const InputField = ({ label, icon, value, onChange, placeholder, action, type = "text" }: any) => (
    <div className="space-y-3">
        <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                <span className="opacity-40 mr-2">{icon}</span>
                {label}
            </label>
            {action}
        </div>
        <Input
            type={type}
            className="h-14 rounded-2xl bg-white border-2 border-slate-900 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-black text-slate-900"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required
        />
    </div>
);
