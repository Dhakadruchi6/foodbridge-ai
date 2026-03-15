"use client";

import { useEffect, useState } from "react";
import { getRequest, postRequest } from "@/lib/apiClient";
import {
  Package,
  MapPin,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock,
  Loader2,
  Utensils,
  Navigation,
  Sparkles,
  Info,
  Timer,
  Weight,
  ExternalLink,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Donation {
  _id: string;
  foodType: string;
  quantity: number | string;
  expiryTime: string;
  pickupAddress: string;
  city: string;
  status: string;
  prioritizationRank?: number;
  distance?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string;
  donorId: { name: string; email: string } | null;
}

export const AvailableDonations = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchAvailable = async () => {
    try {
      const result = await getRequest("/api/donations/available");
      if (result.success) {
        setDonations(result.data.sort((a: any, b: any) => (b.prioritizationRank || 0) - (a.prioritizationRank || 0)));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load donations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailable();
  }, []);

  const handleAccept = async (donationId: string) => {
    setProcessingId(donationId);
    setError("");
    try {
      const result = await postRequest(`/api/donations/accept`, { donationId });
      if (result.success) {
        fetchAvailable();
      }
    } catch (err: any) {
      setError(err.message || "Failed to accept donation");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 bg-white border border-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-20 text-center mt-6">
        <Navigation className="w-10 h-10 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-black text-slate-900">No Nearby Batches</h3>
        <p className="text-slate-500 text-sm font-medium mt-1">We'll alert you when surplus matches your operational zone.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-xs font-bold flex items-center">
          <Info className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {donations.map((donation) => (
          <AvailableCard
            key={donation._id}
            donation={donation}
            onAccept={handleAccept}
            isProcessing={processingId === donation._id}
          />
        ))}
      </div>
    </div>
  );
};

const AvailableCard = ({ donation, onAccept, isProcessing }: { donation: Donation; onAccept: (id: string) => void; isProcessing: boolean }) => {
  const urgencyScore = Math.round(donation.prioritizationRank || 65);

  const getUrgencyStyles = (score: number) => {
    if (score >= 80) return "text-rose-600 bg-rose-50 border-rose-100";
    if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-indigo-600 bg-indigo-50 border-indigo-100";
  };

  const formatCity = (city: string) => city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

  const getExpiryDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = date.getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 0) return "Expired";
    if (hours < 1) return "< 1 hour left";
    return `${hours} hours left`;
  };

  return (
    <div className="premium-card rounded-xl flex flex-col h-full group overflow-hidden bg-white">
      {/* Upper Section */}
      <div className="p-5 flex-1 space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors">
            <Utensils className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
          </div>
          <div className={cn(
            "px-2.5 py-1 rounded-md border text-[10px] font-black uppercase tracking-wider flex items-center",
            getUrgencyStyles(urgencyScore)
          )}>
            <Sparkles className="w-3 h-3 mr-1.5" />
            Priority: {urgencyScore}/100
          </div>
        </div>

        <div>
          <h4 className="text-xl font-black text-slate-900 leading-tight truncate">
            {donation.foodType || "Surplus Batch"}
          </h4>
          <div className="flex flex-col space-y-1 mt-1">
            <div className="flex items-center text-[10px] font-black text-primary uppercase tracking-widest">
              <User className="w-3.5 h-3.5 mr-1.5" />
              <span>{donation.donorId?.name || "Anonymous Donor"}</span>
            </div>
            <div className="flex items-center text-[11px] font-bold text-slate-400">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-300" />
              <span className="truncate">
                {donation.city ? formatCity(donation.city) : "Zone Restricted"}
                {donation.distance !== null && donation.distance !== undefined && (
                  <span className="ml-1 text-primary font-black">
                    • {donation.distance}km away
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {donation.description && (
          <p className="text-[11px] font-medium text-slate-500 line-clamp-2 leading-relaxed italic">
            "{donation.description}"
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100/50">
            <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
              <Weight className="w-3 h-3 mr-1.5" /> Payload
            </div>
            <p className="text-sm font-black text-slate-700">{donation.quantity}kg</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100/50">
            <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
              <Timer className="w-3 h-3 mr-1.5" /> Decay Lock
            </div>
            <p className={cn(
              "text-sm font-black",
              urgencyScore >= 80 ? "text-rose-600" : "text-slate-700"
            )}>
              {getExpiryDisplay(donation.expiryTime)}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation & Action Footer */}
      <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 mt-auto space-y-3">
        {donation.latitude && donation.longitude && (
          <div className="flex gap-2">
            <a
              href={`https://www.google.com/maps?q=${donation.latitude},${donation.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-10 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center space-x-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Live Location</span>
            </a>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${donation.latitude},${donation.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-10 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center space-x-2"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Navigate</span>
            </a>
          </div>
        )}
        <Button
          onClick={() => onAccept(donation._id)}
          disabled={isProcessing}
          className="w-full h-11 rounded-lg text-sm font-black shadow-sm hover:shadow-md transition-all bg-primary hover:bg-primary/90 flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Accept Mission</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
