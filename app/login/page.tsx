"use client";

import { LoginForm } from "@/components/forms/LoginForm";
import { Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex flex-col items-center justify-center p-6 lg:p-12 saas-gradient relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="relative z-10 w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center mb-10 space-y-6">
          <Link href="/" className="bg-primary p-4 rounded-xl shadow-2xl shadow-primary/20 hover:rotate-12 transition-all duration-500 group">
            <Zap className="w-8 h-8 text-white fill-white/20 group-hover:scale-110 transition-transform" />
          </Link>
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
              Operational <span className="text-primary italic font-serif opacity-80 pl-1">Access</span>
            </h1>
            <p className="hero-desc text-lg sm:text-2xl text-slate-600 dark:text-slate-400 font-bold leading-relaxed max-w-2xl text-balance">
              Automated food redistribution powered by AI. Connecting corporate surplus with verified NGOs in real-time.
            </p>
          </div>
        </div>

        <div className="premium-card p-1 items-center rounded-2xl bg-white overflow-hidden">
          <div className="p-8">
            <LoginForm />
          </div>
          <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span className="flex items-center"><ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> AES-256 Encrypted</span>
            <span>v4.2.0-stable</span>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-loose max-w-sm mx-auto">
          Authorized personnel only. All access events are logged and audited via AI compliance protocols.
        </p>
      </div>
    </div>
  );
}
