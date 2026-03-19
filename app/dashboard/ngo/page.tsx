"use client";

import { useEffect, useState } from "react";
import { getRequest, postRequest } from "@/lib/apiClient";
import { AvailableDonations } from "@/components/ngo/AvailableDonations";
import { ActiveDeliveries } from "@/components/ngo/ActiveDeliveries";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { OnboardingTour } from "@/components/shared/OnboardingTour";
import { IncomingRequests } from '@/components/ngo/IncomingRequests';
import { CertificationModal } from "@/components/ngo/CertificationModal";
import { NotificationBell } from "@/components/donor/NotificationBell";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ChevronRight,
  CircleDot,
  MapPin,
  Package,
  Radar,
  Settings,
  ShieldCheck,
  TrendingUp,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NGODashboard() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [scanRadius, setScanRadius] = useState(100);
  const [syncing, setSyncing] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [, setLocError] = useState("");

  const handleAction = () => {
    setRefreshKey(prev => prev + 1);
    // Also refresh stats
    fetchStats();
  };

  const handleAdjustRadar = () => {
    const radiuses = [10, 25, 50, 100];
    const nextIndex = (radiuses.indexOf(scanRadius) + 1) % radiuses.length;
    setScanRadius(radiuses[nextIndex]);
  };

  const handleSetOperationalCenter = async () => {
    if (!navigator.geolocation) {
      setLocError("Location services not supported by your browser");
      return;
    }

    setIsCapturing(true);
    setLocError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const result = await postRequest("/api/user/profile", { latitude, longitude });
          if (result.success) {
            // Update local user state with new location
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setUser((prevUser: any) => ({ ...prevUser, latitude, longitude }));
          } else {
            setLocError(result.message || "Failed to save location");
          }
        } catch (err) {
          setLocError("Internal error saving location");
        } finally {
          setIsCapturing(false);
        }
      },
      (err) => {
        setLocError(err.message || "Geolocation permission denied");
        setIsCapturing(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSyncPriority = async () => {
    setSyncing(true);
    try {
      await postRequest("/api/ml/recalculate-priority", {});
      window.location.reload();
    } catch (err) {
      console.error("Failed to sync priority", err);
    } finally {
      setSyncing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const result = await getRequest("/api/analytics/summary");
      if (result.success) setStats(result.data);
    } catch (err) {
      console.error("Failed to fetch NGO stats", err);
    }
  };

  useEffect(() => {
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
      await getRequest("/api/user/tour-complete");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setUser((prev: any) => ({ ...prev, isFirstLogin: false }));
    } catch (err) {
      console.error("Failed to mark tour as complete", err);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["ngo"]}>
      <div className="min-h-screen saas-gradient">
        {user && (
          <OnboardingTour
            userRole="ngo"
            isFirstLogin={Boolean(user.isFirstLogin)}
            onComplete={handleTourComplete}
          />
        )}
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">

          {/* SaaS Navigation - Breadcrumbs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              <Link href="/" className="hover:text-primary transition-colors">Platform</Link>
              <ChevronRight className="w-3 h-3 opacity-50" />
              <span className="text-slate-900">Intelligence Hub</span>
            </div>
            <div className="flex items-center space-x-3">
              <Link id="tour-profile" href="/profile" className="flex items-center space-x-1.5 h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-primary hover:border-primary/30 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
                <Settings className="w-4 h-4" />
                <span>My Profile</span>
              </Link>
              <div id="tour-notifications">
                <NotificationBell />
              </div>
            </div>
          </div>

          {/* Dynamic Header Section */}
          <div className="relative group overflow-hidden bg-white border border-slate-200/60 rounded-2xl p-10 shadow-sm">
            <div id="tour-nearby-map" className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-1000">
              <Radar className="w-64 h-64 text-slate-900" />
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10">
              <div className="space-y-4 flex-1">
                {user && (user as any).verificationStatus === 'pending' && (
                  <div className="mb-6 p-6 bg-rose-50 border-2 border-rose-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 shadow-sm animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-rose-900 tracking-tight">Security Clearance Pending</h4>
                      <p className="text-sm text-rose-700 font-bold leading-relaxed max-w-2xl">
                        Your operational credentials are under review by Platform Administrators. You cannot accept any live food missions or broadcast locations until your submitted registration certificates and Government IDs are securely verified.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <div className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-md flex items-center">
                    <Activity className="w-3 h-3 mr-1.5" /> Live Radar
                  </div>
                  <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <CircleDot className="w-3 h-3 mr-1.5 text-emerald-500 animate-pulse" /> Scanning {scanRadius}km Zone
                  </div>
                  {user && (!user.latitude || !user.longitude) && (
                    <Link href="/profile" className="px-2.5 py-1 bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-md flex items-center hover:bg-amber-500/20 transition-colors">
                      <MapPin className="w-3 h-3 mr-1.5" /> Location Missing — Update Profile
                    </Link>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-[1.1]">
                  Operational <span className="text-primary tracking-normal font-serif italic text-3xl opacity-80 pl-2">Visibility</span>
                </h1>
                <p className="text-slate-500 font-medium text-lg max-w-lg leading-relaxed">
                  Real-time surplus ingestion from verified donors. Optimized by prioritizing decay kinetics and mission proximity.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {user && (!user.latitude || !user.longitude) && (
                  <Button
                    onClick={handleSetOperationalCenter}
                    disabled={isCapturing}
                    className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] flex items-center space-x-2"
                  >
                    <MapPin className={cn("w-4 h-4", isCapturing && "animate-bounce")} />
                    <span>{isCapturing ? "Pinning GPS..." : "Set Operational Center"}</span>
                  </Button>
                )}
                <Button
                  onClick={handleSyncPriority}
                  disabled={syncing}
                  className="h-12 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] flex items-center space-x-2"
                >
                  <Zap className={cn("w-4 h-4 text-primary", syncing && "animate-spin")} />
                  <span>{syncing ? "Optimizing..." : "Sync Intelligence"}</span>
                </Button>
                <Button
                  onClick={handleAdjustRadar}
                  variant="outline"
                  className="h-12 px-6 rounded-xl border-slate-200 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center space-x-2 active:scale-95"
                >
                  <Radar className="w-4 h-4 text-primary animate-pulse" />
                  <span>Range: {scanRadius}km</span>
                </Button>
              </div>
            </div>
          </div>

          {/* High-Contrast Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatBlock
              label="Fleet Throughput"
              value={stats ? `${stats.totalRecovered}kg` : "--"}
              icon={<Package className="w-5 h-5" />}
              status="Live Feed"
            />
            <StatBlock
              label="Mission Success"
              value={stats ? `${stats.successRate}%` : "--"}
              icon={<ShieldCheck className="w-5 h-5" />}
              status="Optimal"
            />
            <StatBlock
              label="Recovery Matrix"
              value={stats ? `${(Number(stats.totalRecovered) * 12).toLocaleString()}` : "--"}
              icon={<TrendingUp className="w-5 h-5" />}
              status="+12.4%"
            />
            <StatBlock
              label="Active Missions"
              value={stats?.activeMissions ? String(stats.activeMissions) : "0"}
              icon={<Activity className="w-5 h-5" />}
              status="Processing"
            />
          </div>

          {/* Main Interface Mesh */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Primary Feed - Available Missions */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Priority Mission Pipeline</h2>
                  <div className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded border border-slate-200/50">
                    AI Sorted
                  </div>
                </div>
                <Link href="#" className="flex items-center text-[10px] font-black text-primary uppercase tracking-widest hover:translate-x-1 transition-transform">
                  Global Map <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>

              <div id="tour-incoming-requests" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <IncomingRequests onAction={handleAction} />
              </div>

              <div id="tour-available-list" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <AvailableDonations radius={scanRadius} onAction={handleAction} />
              </div>
            </div>

            {/* Logistics Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Mission Control</h3>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </div>

                <div className="bg-slate-50/50 border border-slate-200/60 rounded-[1.25rem] p-5">
                  <ActiveDeliveries refreshKey={refreshKey} />
                  <Link href="/dashboard/ngo/logistics">
                    <Button variant="ghost" className="w-full mt-4 h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary hover:bg-primary/5 transition-all">
                      Open Logistics Command <ArrowRight className="w-3.5 h-3.5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="bg-slate-900 rounded-[1.25rem] p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <ShieldCheck className="w-20 h-20" />
                </div>
                <div className="relative z-10 space-y-4">
                  <h4 className="text-lg font-black">Mission Integrity</h4>
                  <p className="text-slate-400 text-xs font-medium leading-relaxed">
                    All data points in this perimeter are verified for safety compliance and source authenticity.
                  </p>
                  <Button
                    onClick={() => setIsCertModalOpen(true)}
                    className="h-10 px-5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-md transition-all"
                  >
                    View Certifications
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <CertificationModal
            isOpen={isCertModalOpen}
            onClose={() => setIsCertModalOpen(false)}
          />
        </div>
      </div>
    </ProtectedRoute >
  );
}

const StatBlock = ({ label, value, icon, status }: { label: string, value: string, icon: React.ReactNode, status: string }) => (
  <div className="premium-card p-6 rounded-xl space-y-4 flex flex-col justify-between group">
    <div className="flex items-center justify-between">
      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors">
        <div className="text-slate-400 group-hover:text-primary transition-colors">
          {icon}
        </div>
      </div>
      <div className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-300 group-hover:text-slate-500 transition-colors">
        {status}
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    </div>
  </div>
);
