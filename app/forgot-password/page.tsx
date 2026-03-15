"use client";

import { useState } from "react";
import { postRequest } from "@/lib/apiClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await postRequest("/api/auth/forgot-password", { email });
            if (res.success) {
                setMessage("A secure reset link has been dispatched to your inbox.");
            }
        } catch (err: any) {
            setError(err.message || "Failed to process request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.05),transparent_500px)]">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white shadow-xl mb-4">
                        <Mail className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Recover Keys</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Enter your email to reset security credentials</p>
                </div>

                <div className="glass-card rounded-[2.5rem] bg-white p-10 shadow-2xl space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                <Mail className="w-3.5 h-3.5 mr-2" />
                                Registered Email
                            </label>
                            <Input
                                type="email"
                                placeholder="name@company.com"
                                className="h-14 rounded-2xl bg-white border-2 border-slate-900 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-black"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={!!message}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center space-x-3 p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
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

                        {!message && (
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-lg font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><span>Dispatch Reset Link</span> <ArrowRight className="w-5 h-5" /></>}
                            </Button>
                        )}
                    </form>

                    <div className="text-center">
                        <a href="/login" className="text-xs font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
                            Back to Secure Login
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
