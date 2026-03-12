"use client";

import { useEffect, useState } from "react";
import { getRequest } from "@/lib/apiClient";
import {
  Package,
  MapPin,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
  Inbox,
  Activity,
  Box,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Donation {
  _id: string;
  foodType: string;
  quantity: number | string;
  expiryTime: string;
  address: string;
  city: string;
  status: "pending" | "accepted" | "collected" | "delivered" | "picked_up";
}

export const MyDonations = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchDonations = async () => {
    try {
      const result = await getRequest("/api/donations/my-donations");
      if (result.success) {
        setDonations(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch donations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-white border border-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-20 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
            <Inbox className="w-7 h-7 text-slate-300" />
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Zero Active Assets</h3>
          <p className="text-slate-500 font-bold text-sm max-w-xs mx-auto">
            Your asset ledger is currently empty. Initiate a registration to start redistribution.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 p-1.5 bg-white border border-slate-200/60 rounded-xl mb-6 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            placeholder="Search operational ledger..."
            className="w-full h-9 pl-10 bg-transparent text-[11px] font-black uppercase tracking-widest focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-4">
        {donations.map((donation) => (
          <DonationCard
            key={donation._id}
            donation={donation}
            isExpanded={expandedId === donation._id}
            onToggle={() => setExpandedId(expandedId === donation._id ? null : donation._id)}
            onAssignSuccess={fetchDonations}
          />
        ))}
      </div>
    </div>
  );
};

import { MLMatchResults } from "./MLMatchResults";
import { DeliveryTracking } from "./DeliveryTracking";

const DonationCard = ({
  donation,
  isExpanded,
  onToggle,
  onAssignSuccess
}: {
  donation: Donation;
  isExpanded: boolean;
  onToggle: () => void;
  onAssignSuccess?: () => void;
}) => {
  const statusMap = {
    pending: { color: "bg-amber-50 text-amber-600 border-amber-100", icon: <Clock className="w-3 h-3" />, label: "Awaiting Match" },
    accepted: { color: "bg-indigo-50 text-indigo-600 border-indigo-100", icon: <CheckCircle2 className="w-3 h-3" />, label: "Entity Matched" },
    picked_up: { color: "bg-blue-50 text-blue-600 border-blue-100", icon: <Activity className="w-3 h-3" />, label: "Live Transit" },
    delivered: { color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: <CheckCircle2 className="w-3 h-3" />, label: "Mission Success" },
    collected: { color: "bg-indigo-50 text-indigo-600 border-indigo-100", icon: <Box className="w-3 h-3" />, label: "In Custody" }
  };

  const statusObj = statusMap[donation.status] || statusMap.pending;

  return (
    <div className="premium-card rounded-xl border border-slate-200/60 overflow-hidden bg-white shadow-sm flex flex-col items-stretch group transition-all duration-300">
      <div className="p-5 flex flex-col md:flex-row items-center gap-6">
        {/* Asset Icon */}
        <div className="shrink-0 w-12 h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center group-hover:bg-primary/5 transition-colors">
          <Box className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
        </div>

        {/* Payload Context */}
        <div className="flex-1 min-w-0 text-center md:text-left space-y-1.5">
          <h4 className="text-base font-black text-slate-900 tracking-tight leading-none truncate">
            {donation.foodType || "Operational Asset"}
          </h4>
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-4 gap-y-1">
            <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Activity className="w-3 h-3 mr-1.5 opacity-50" /> {donation.quantity} kg
            </div>
            <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Calendar className="w-3 h-3 mr-1.5 opacity-50" /> {donation.expiryTime ? new Date(donation.expiryTime).toLocaleDateString() : 'N/A'}
            </div>
            <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <MapPin className="w-3 h-3 mr-1.5 opacity-50" /> {donation.city}
            </div>
          </div>
        </div>

        {/* Global Orchestration Status */}
        <div className="flex flex-col items-center md:items-end gap-3 shrink-0">
          <div className={cn(
            "px-2.5 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest flex items-center space-x-1.5",
            statusObj.color
          )}>
            {statusObj.icon}
            <span>{statusObj.label}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 px-3 rounded-lg text-primary text-[9px] font-black uppercase tracking-[0.15em] hover:bg-primary/5 transition-all"
          >
            {isExpanded ? "Close Control" : "Track Matrix"}
            <ArrowRight className={cn(
              "ml-1.5 w-3 h-3 transition-transform duration-300",
              isExpanded ? "-rotate-90" : "group-hover:translate-x-0.5"
            )} />
          </Button>
        </div>
      </div>

      {/* Control Expansion */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-slate-100 bg-slate-50/30 animate-in slide-in-from-top-2 duration-500">
          <div className="pt-5 overflow-hidden">
            {donation.status === "pending" ? (
              <MLMatchResults donationId={donation._id} onSuccess={onAssignSuccess} />
            ) : (
              <DeliveryTracking donationId={donation._id} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
