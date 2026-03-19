"use client";

import { useState } from "react";
import { postRequest } from "@/lib/apiClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
    const params = useParams();
    const token = Array.isArray(params.token) ? params.token[0] : params.token;
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await postRequest("/api/auth/reset-password", { token, password });
            if (res.success) {
                setMessage("Security credentials updated. Redirecting to login...");
                setTimeout(() => router.push("/login"), 3000);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.05),transparent_500px)]">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white shadow-xl mb-4">
                        <ShieldCheck className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Set New Keys</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Update your security credentials for access</p>
                </div>

                <div className="glass-card rounded-[2.5rem] bg-white p-10 shadow-2xl space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                <Lock className="w-3.5 h-3.5 mr-2" />
                                New Security Key
                            </label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                className="h-14 rounded-2xl bg-white border-2 border-slate-900 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-black"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                <Lock className="w-3.5 h-3.5 mr-2" />
                                Confirm New Key
                            </label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                className="h-14 rounded-2xl bg-white border-2 border-slate-900 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-black"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="flex items-center space-x-3 p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 italic">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm font-bold">{error}</span>
                            </div>
                        )}

                        {message && (
                            <div className="flex items-center space-x-3 p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 animate-in zoom-in duration-300">
                                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm font-bold">{message}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading || !!message}
                            className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-lg font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><span>Update Credentials</span> <ArrowRight className="w-5 h-5" /></>}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
