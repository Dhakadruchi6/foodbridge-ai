"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ResetPasswordRoot() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 border-4 border-white shadow-xl">
                    <ShieldAlert className="w-10 h-10 text-amber-500" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Invalid Reset Link</h1>
                <p className="text-slate-600 font-medium leading-relaxed">
                    This security link appears to be incomplete. Please check your email for the full link or request a new one.
                </p>
                <Link href="/forgot-password">
                    <Button className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black mt-4">
                        Request New Link
                    </Button>
                </Link>
            </div>
        </div>
    );
}
