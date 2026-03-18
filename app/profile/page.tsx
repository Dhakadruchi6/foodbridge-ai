"use client";

import { useEffect, useState } from "react";
import { getRequest, patchRequest } from "@/lib/apiClient";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { User, Mail, Phone, MapPin, Building, Calendar, Edit3, Save, X, CheckCircle, Shield, Package, Loader2, Hash, Zap, Bell, BellOff } from "lucide-react";
import { Switch } from "../../components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Profile {
    _id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    address: string;
    pincode: string;
    role: string;
    createdAt: string;
    isActive: boolean;
    ngoName?: string;
    registrationNumber?: string;
    verificationStatus?: string;
    description?: string;
    donationPreferences?: string;
    smsEnabled?: boolean;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [form, setForm] = useState<Partial<Profile>>({});

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const result = await getRequest("/api/user/profile");
                if (result.success) {
                    setProfile(result.data);
                    setForm(result.data);
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                setError(err.message || "Failed to load profile");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleEdit = () => {
        setEditing(true);
        setSuccess("");
        setError("");
        setForm(profile!);
    };

    const handleCancel = () => {
        setEditing(false);
        setForm(profile!);
        setError("");
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        try {
            const result = await patchRequest("/api/user/profile", {
                name: form.name,
                phone: form.phone,
                city: form.city,
                state: form.state,
                address: form.address,
                pincode: form.pincode,
                ...(profile?.role === 'ngo' && { ngoName: form.ngoName, description: form.description }),
            });
            if (result.success) {
                setProfile(prev => ({ ...prev!, ...form }));
                setEditing(false);
                setSuccess("Profile updated successfully!");
                setTimeout(() => setSuccess(""), 4000);
            } else {
                setError(result.message || "Update failed");
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message || "Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const verificationColor = {
        approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
        pending: "bg-amber-50 text-amber-700 border-amber-200",
        rejected: "bg-rose-50 text-rose-700 border-rose-200",
    };

    if (loading) return (
        <ProtectedRoute allowedRoles={["donor", "ngo", "admin"]}>
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        </ProtectedRoute>
    );

    return (
        <ProtectedRoute allowedRoles={["donor", "ngo", "admin"]}>
            <div className="min-h-screen bg-slate-50/40 saas-gradient py-12 px-4">
                <div className="max-w-3xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Account</p>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
                        </div>
                        <Link href={profile?.role === 'ngo' ? '/dashboard/ngo' : '/dashboard/donor'}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors flex items-center">
                            ← Back to Dashboard
                        </Link>
                    </div>

                    {/* Success / Error alerts */}
                    {success && (
                        <div className="flex items-center space-x-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-bold">
                            <CheckCircle className="w-4 h-4" />
                            <span>{success}</span>
                        </div>
                    )}
                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-bold">
                            {error}
                        </div>
                    )}

                    {/* Identity Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                        <div className="bg-slate-900 p-8 flex items-start justify-between">
                            <div className="flex items-center space-x-5">
                                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-black text-white">
                                    {profile?.name?.substring(0, 2).toUpperCase() || "?"}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tight">{profile?.name}</h2>
                                    <p className="text-slate-400 text-sm font-medium mt-0.5">{profile?.email}</p>
                                    <div className="flex items-center space-x-3 mt-2">
                                        <span className={cn(
                                            "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                            profile?.role === 'donor' ? "bg-indigo-500/20 text-indigo-300 border-indigo-400/20" :
                                                profile?.role === 'ngo' ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/20" :
                                                    "bg-rose-500/20 text-rose-300 border-rose-400/20"
                                        )}>
                                            {profile?.role}
                                        </span>
                                        {profile?.verificationStatus && (
                                            <span className={cn(
                                                "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                verificationColor[profile.verificationStatus as keyof typeof verificationColor] || ""
                                            )}>
                                                <Shield className="w-3 h-3 inline mr-1" />
                                                {profile.verificationStatus}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {!editing ? (
                                <Button onClick={handleEdit} className="h-9 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[10px] font-black uppercase tracking-widest transition-all">
                                    <Edit3 className="w-3.5 h-3.5 mr-2" /> Edit Profile
                                </Button>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <Button onClick={handleSave} disabled={saving} className="h-9 px-5 rounded-xl bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase tracking-widest">
                                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Save className="w-3.5 h-3.5 mr-2" />Save</>}
                                    </Button>
                                    <Button onClick={handleCancel} variant="ghost" className="h-9 px-4 rounded-xl text-white/70 hover:bg-white/10 text-[10px] font-black">
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* UX Controls: Tour & Notifications */}
                        <div className="px-8 py-4 bg-slate-50 border-b border-slate-200/60 flex flex-wrap items-center gap-6">
                            <div className="flex items-center space-x-3">
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                    profile?.smsEnabled ? "bg-primary/10 text-primary" : "bg-slate-200 text-slate-400"
                                )}>
                                    {profile?.smsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">SMS Alerts</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Real-time mobile notifications</p>
                                </div>
                                <Switch
                                    checked={profile?.smsEnabled || false}
                                    onCheckedChange={async (val: boolean) => {
                                        try {
                                            const res = await patchRequest("/api/user/profile", { smsEnabled: val });
                                            if (res.success) {
                                                setProfile(prev => ({ ...prev!, smsEnabled: val }));
                                                setSuccess(`SMS alerts ${val ? 'enabled' : 'disabled'}`);
                                                setTimeout(() => setSuccess(""), 2000);
                                            }
                                        } catch (err) {
                                            setError("Failed to update SMS preference");
                                        }
                                    }}
                                />
                            </div>

                            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                            <Button
                                onClick={async () => {
                                    try {
                                        const res = await patchRequest("/api/user/tour-complete", { isFirstLogin: true });
                                        if (res.success) {
                                            setSuccess("Tour reset! Redirecting to dashboard...");
                                            setTimeout(() => {
                                                window.location.href = profile?.role === 'ngo' ? '/dashboard/ngo' : '/dashboard/donor';
                                            }, 1500);
                                        }
                                    } catch (err) {
                                        setError("Failed to reset tour");
                                    }
                                }}
                                variant="outline"
                                className="h-9 px-4 rounded-xl border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-white"
                            >
                                <Zap className="w-3.5 h-3.5 mr-2 text-amber-500" />
                                Restart Website Tour
                            </Button>
                        </div>

                        {/* Details Grid */}
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Full Name */}
                                <ProfileField
                                    label="Full Name"
                                    icon={<User className="w-4 h-4" />}
                                    value={profile?.name || ""}
                                    editValue={form.name || ""}
                                    editing={editing}
                                    editable
                                    onChange={v => setForm(f => ({ ...f, name: v }))}
                                />
                                {/* Email - non-editable */}
                                <ProfileField
                                    label="Email Address"
                                    icon={<Mail className="w-4 h-4" />}
                                    value={profile?.email || ""}
                                    editValue={profile?.email || ""}
                                    editing={false}
                                    editable={false}
                                />
                                {/* Phone */}
                                <ProfileField
                                    label="Phone Number"
                                    icon={<Phone className="w-4 h-4" />}
                                    value={profile?.phone || "—"}
                                    editValue={form.phone || ""}
                                    editing={editing}
                                    editable
                                    onChange={v => setForm(f => ({ ...f, phone: v }))}
                                />
                                {/* City */}
                                <ProfileField
                                    label="City"
                                    icon={<MapPin className="w-4 h-4" />}
                                    value={profile?.city || "—"}
                                    editValue={form.city || ""}
                                    editing={editing}
                                    editable
                                    onChange={v => setForm(f => ({ ...f, city: v }))}
                                />
                                {/* State */}
                                <ProfileField
                                    label="State"
                                    icon={<MapPin className="w-4 h-4" />}
                                    value={profile?.state || "—"}
                                    editValue={form.state || ""}
                                    editing={editing}
                                    editable
                                    onChange={v => setForm(f => ({ ...f, state: v }))}
                                />
                                {/* Pincode */}
                                <ProfileField
                                    label="Pincode"
                                    icon={<Hash className="w-4 h-4" />}
                                    value={profile?.pincode || "—"}
                                    editValue={form.pincode || ""}
                                    editing={editing}
                                    editable
                                    onChange={v => setForm(f => ({ ...f, pincode: v }))}
                                />
                                {/* Address - full width */}
                                <div className="md:col-span-2">
                                    <ProfileField
                                        label="Address"
                                        icon={<Building className="w-4 h-4" />}
                                        value={profile?.address || "—"}
                                        editValue={form.address || ""}
                                        editing={editing}
                                        editable
                                        onChange={v => setForm(f => ({ ...f, address: v }))}
                                    />
                                </div>
                                {/* User Type - non-editable */}
                                <ProfileField
                                    label="User Type"
                                    icon={<Shield className="w-4 h-4" />}
                                    value={profile?.role?.toUpperCase() || ""}
                                    editValue={profile?.role || ""}
                                    editing={false}
                                    editable={false}
                                />
                                {/* Account Created */}
                                <ProfileField
                                    label="Account Created"
                                    icon={<Calendar className="w-4 h-4" />}
                                    value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : "—"}
                                    editValue=""
                                    editing={false}
                                    editable={false}
                                />
                            </div>

                            {/* NGO-specific fields */}
                            {profile?.role === 'ngo' && (
                                <div className="border-t border-slate-100 pt-6 space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">NGO Information</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <ProfileField
                                            label="NGO Name"
                                            icon={<Building className="w-4 h-4" />}
                                            value={profile?.ngoName || "—"}
                                            editValue={form.ngoName || ""}
                                            editing={editing}
                                            editable
                                            onChange={v => setForm(f => ({ ...f, ngoName: v }))}
                                        />
                                        <ProfileField
                                            label="Registration Number"
                                            icon={<Hash className="w-4 h-4" />}
                                            value={profile?.registrationNumber || "—"}
                                            editValue={profile?.registrationNumber || ""}
                                            editing={false}
                                            editable={false}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Donor specific */}
                            {profile?.role === 'donor' && profile?.donationPreferences && (
                                <div className="border-t border-slate-100 pt-6">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Donation Preferences</p>
                                    <p className="text-sm font-bold text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <Package className="w-4 h-4 inline mr-2 text-primary" />
                                        {profile.donationPreferences}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}

// Reusable Field Component
const ProfileField = ({
    label, icon, value, editValue, editing, editable, onChange
}: {
    label: string;
    icon: React.ReactNode;
    value: string;
    editValue: string;
    editing: boolean;
    editable: boolean;
    onChange?: (v: string) => void;
}) => (
    <div className="space-y-1.5">
        <label className="flex items-center space-x-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
            {icon}
            <span>{label}</span>
            {!editable && <span className="text-[8px] text-slate-300 normal-case tracking-normal font-medium">(read-only)</span>}
        </label>
        {editing && editable ? (
            <Input
                value={editValue}
                onChange={e => onChange?.(e.target.value)}
                className="h-10 rounded-xl border-slate-200 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
        ) : (
            <p className={cn(
                "text-sm font-bold px-3 py-2.5 rounded-xl border",
                editable ? "text-slate-800 bg-slate-50 border-slate-100" : "text-slate-500 bg-slate-50/50 border-slate-100/50 italic"
            )}>
                {value || "—"}
            </p>
        )}
    </div>
);
