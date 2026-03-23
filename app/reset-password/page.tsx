import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function ResetPasswordFallbackPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.05),transparent_500px)]">
            <div className="max-w-md w-full glass-card rounded-[2.5rem] bg-white p-10 shadow-2xl text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-rose-50 mb-2">
                    <AlertCircle className="w-8 h-8 text-rose-500" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Invalid or expired reset link</h1>
                <p className="text-slate-500 text-sm font-medium">
                    This password reset link is invalid or missing its security token. Please request a new link.
                </p>
                <Link
                    href="/forgot-password"
                    className="inline-flex items-center justify-center w-full h-14 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 transition-all space-x-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Forgot Password</span>
                </Link>
            </div>
        </div>
    );
}
