"use client";

import { RegisterForm } from "@/components/forms/RegisterForm";
import Image from "next/image";
import { Zap, Globe } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex flex-col items-center justify-center p-6 lg:p-12 saas-gradient relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-primary/5 blur-[150px] rounded-full -translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center mb-10 space-y-6">
          <Link href="/" className="relative w-24 h-24 hover:-rotate-12 transition-transform duration-500 group">
            <Image
              src="/logo.png"
              alt="FoodBridge AI Logo"
              fill
              className="object-contain"
              priority
            />
          </Link>
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none text-center">
              Network <span className="text-primary italic font-serif opacity-80 pl-1">Onboarding</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-lg text-center">Join 500+ verified nodes in the global food recovery ecosystem</p>
          </div>
        </div>

        <div className="premium-card p-1 items-center rounded-2xl bg-white overflow-hidden">
          <div className="p-8">
            <Suspense fallback={<div className="h-64 flex items-center justify-center font-bold text-slate-400">Loading registry...</div>}>
              <RegisterForm />
            </Suspense>
          </div>
          <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span className="flex items-center"><Globe className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> Global Compliance Certified</span>
            <span>Tier: Entry Level Node</span>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-loose max-w-sm mx-auto">
          By registering, you agree to the Humanitarian Protocol and AI Redistribution Standards. Verified identity is required for high-volume transactions.
        </p>
      </div>
    </div>
  );
}
