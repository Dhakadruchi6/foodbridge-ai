"use client";

import { useEffect, useState } from "react";
import { getRequest } from "@/lib/apiClient";
import { CreateDonationForm } from "@/components/donor/CreateDonationForm";
import { MyDonations } from "@/components/donor/MyDonations";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { NotificationBell } from "@/components/donor/NotificationBell";
import { OnboardingTour } from "@/components/shared/OnboardingTour";
import { LiveActivityFeed } from "@/components/shared/LiveActivityFeed";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  History,
  ChevronRight,
  Leaf,
  Activity,
  LayoutDashboard,
  UserCircle,
  Package2,
  Utensils,
  Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


export default function DonorDashboard() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await getRequest("/api/analytics/summary");
        if (result.success) setStats(result.data);
      } catch (err) {
        console.error("Failed to fetch donor stats", err);
      }
    };
    const fetchProfile = async () => {
      try {
        const result = await getRequest("/api/user/profile");
        if (result.success) setUser(result.data);
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      }
    };
    fetchStats();
    fetchProfile();
  }, []);

  const handleTourComplete = async () => {
    try {
      await getRequest("/api/user/tour-complete"); // Using GET as a simple trigger or PATCH if I create it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setUser((prev: any) => ({ ...prev, isFirstLogin: false }));
    } catch (err) {
      console.error("Failed to mark tour as complete", err);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["donor"]}>
      <div className="min-h-screen saas-gradient">
        {user && (
          <OnboardingTour
            userRole="donor"
            isFirstLogin={Boolean(user.isFirstLogin)}
            onComplete={handleTourComplete}
          />
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-8 sm:space-y-12">

          {/* Unified Navigation - Breadcrumbs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center space-x-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              <Link href="/" className="flex items-center space-x-2 hover:text-primary transition-colors">
                <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                  <Image
                    src="/logo.png"
                    alt="FoodBridge Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <span>Platform</span>
              </Link>
              <ChevronRight className="w-3 h-3 opacity-50" />
              <span className="text-slate-900">Donor Control Station</span>
            </div>
            <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-3">
              <Link id="tour-profile" href="/profile" className="flex items-center space-x-1.5 h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-primary hover:border-primary/30 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
                <UserCircle className="w-4 h-4" />
                <span>My Profile</span>
              </Link>
              <div id="tour-notifications" className="sm:ml-0">
                <NotificationBell />
              </div>
            </div>
          </div>


          {/* SaaS Header - Operational Control */}
          <div className="relative group overflow-hidden bg-white border border-slate-200/60 rounded-2xl p-6 sm:p-10 shadow-sm">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-1000 hidden sm:block">
              <Plus className="w-64 h-64 text-slate-900" />
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <div className="px-2.5 py-1 bg-primary/10 text-primary text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-md flex items-center">
                    <History className="w-3 h-3 mr-1.5" /> Session Active
                  </div>
                  <div className="flex items-center text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Activity className="w-3 h-3 mr-1.5 text-emerald-500 animate-pulse" /> Network Synchronized
                  </div>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-[1.1]">
                  Resource <span className="text-primary italic font-serif opacity-80 pl-2">Orchestration</span>
                </h1>
                <p className="text-slate-500 font-medium text-base sm:text-lg max-w-lg leading-relaxed">
                  Register surplus assets and monitor their redistribution lifecycle across the humanitarian node network.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Button
                  id="tour-post-donation"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className={cn(
                    "h-14 px-8 rounded-xl font-black text-xs uppercase tracking-[0.1em] shadow-xl transition-all active:scale-[0.98] flex items-center space-x-3",
                    showAddForm
                      ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {showAddForm ? (
                    <>
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Return to Console</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Initiate Batch Registration</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {!showAddForm && (
            <>
              {/* High-Performance Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  label="Total Donations"
                  value={stats ? `${stats.totalDonations}` : "--"}
                  icon={<Package2 className="w-5 h-5 text-indigo-500" />}
                  trend="Food posts created"
                />
                <StatCard
                  label="Meals Served"
                  value={stats ? `${stats.mealsServed}` : "--"}
                  icon={<Utensils className="w-5 h-5 text-emerald-500" />}
                  trend="Successfully delivered"
                />
                <StatCard
                  label="Active Missions"
                  value={stats ? `${stats.activeMissions}` : "--"}
                  icon={<Truck className="w-5 h-5 text-blue-500" />}
                  trend="Currently in progress"
                />
                <StatCard
                  label="Carbon Saved"
                  value={stats ? `${stats.carbonSaved}kg` : "--"}
                  icon={<Leaf className="w-5 h-5 text-amber-500" />}
                  trend="Environmental impact"
                />
              </div>

              {/* Inventory Management Matrix */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
                    <div className="flex items-center space-x-3">
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Ledger</h2>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                  </div>

                  <div id="tour-my-donations" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <MyDonations />
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                  <div id="tour-live-feed">
                    <LiveActivityFeed />
                  </div>
                </div>
              </div>
            </>
          )}

          {showAddForm && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
              <CreateDonationForm onSuccess={() => setShowAddForm(false)} />
            </div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}

const StatCard = ({ label, value, icon, trend }: { label: string, value: string, icon: React.ReactNode, trend: string }) => (
  <div className="premium-card p-5 sm:p-6 rounded-xl flex flex-col justify-between group">
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800 group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors">
        <div className="transition-colors">
          {icon}
        </div>
      </div>
      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 group-hover:text-slate-500 transition-colors">{trend}</div>
    </div>
    <div className="space-y-1">
      <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none tabular-nums">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 leading-tight uppercase tracking-widest">{label}</p>
    </div>
  </div>
);
