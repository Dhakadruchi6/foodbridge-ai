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
  User,
  PhoneCall,
  X,
  ShieldCheck,
  ShieldAlert,
  Camera,
  Hash,
  Mail,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  ZoomIn
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Donation {
  _id: string;
  foodType: string;
  quantity: number | string;
  preparedTime?: string;
  expiryTime: string;
  foodImage?: string;
  pickupAddress: string;
  city: string;
  status: string;
  prioritizationRank?: number;
  distance?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string;
  donorId: { name: string; email: string } | null;
  verificationCode?: string;
  imageVerification?: {
    aiConfidence: number;
    aiCategory: string;
    exifPresent: boolean;
    isSuspicious: boolean;
  };
  ngoVerification?: { ngoId: string; vote: string }[];
}

export const AvailableDonations = ({ radius = 100 }: { radius?: number }) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [acceptedMission, setAcceptedMission] = useState<Donation | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>("pending");


  const fetchAvailable = async () => {
    try {
      const result = await getRequest(`/api/donations/available?radius=${radius}`);
      if (result.success) {
        setDonations(result.data.sort((a: any, b: any) => {
          const timeA = new Date(a.expiryTime).getTime();
          const timeB = new Date(b.expiryTime).getTime();
          if (timeA !== timeB) return timeA - timeB;
          return (b.prioritizationRank || 0) - (a.prioritizationRank || 0);
        }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load donations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailable();
    // Fetch NGO verification status
    getRequest("/api/user/profile").then(res => {
      if (res.success) setVerificationStatus(res.data.verificationStatus || "pending");
    }).catch(() => { });

    // Auto-refresh expiry feed every minute to hide expired ones locally
    const interval = setInterval(() => {
      setDonations(prev => prev.filter(d => new Date(d.expiryTime) > new Date()));
    }, 60000);
    return () => clearInterval(interval);
  }, [radius]);


  const handleAccept = async (donationId: string) => {
    const donationToAccept = donations.find(d => d._id === donationId);
    setProcessingId(donationId);
    setError("");
    try {
      const result = await postRequest(`/api/donations/accept`, { donationId });
      if (result.success) {
        // Show the mission active panel BEFORE refreshing the list
        if (donationToAccept) {
          setAcceptedMission(donationToAccept);
        }
        fetchAvailable();
      }
    } catch (err: any) {
      setError(err.message || "Failed to accept donation");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismissMission = () => {
    setAcceptedMission(null);
  };

  const handleReject = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
  };

  const handleReport = async (id: string) => {
    try {
      const res = await postRequest('/api/admin/reports', {
        donationId: id,
        reason: 'not_food'
      });

      if (res.success) {
        handleReject(id);
      } else {
        setError(res.error || "Failed to submit report.");
      }
    } catch (err: any) {
      console.error("Failed to report", err);
      setError(err.message || "Failed to submit report.");
    }
  };

  // --- Feature 7: NGO Human Verification ---
  const handleVerify = async (donationId: string, vote: 'valid' | 'fake') => {
    try {
      const res = await postRequest('/api/donations/verify-donation', { donationId, vote });
      if (res.success) {
        // Re-fetch to update vote counts
        fetchAvailable();
      } else {
        setError(res.error || 'Verification failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-[450px] bg-white border border-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const visibleDonations = donations.filter(d => !dismissedIds.has(d._id));

  return (
    <div className="space-y-6">
      {/* ✅ Mission Active Panel (shown immediately after accept) */}
      {acceptedMission && (
        <div className="relative bg-emerald-950 text-white rounded-2xl p-8 overflow-hidden border border-emerald-800/40 shadow-2xl animate-in slide-in-from-top-4 duration-400">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShieldCheck className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Mission Active</span>
                </div>
                <h3 className="text-2xl font-black tracking-tight">
                  {acceptedMission.foodType} — Pickup Confirmed
                </h3>
                <p className="text-emerald-300/70 text-sm font-medium">
                  Head to the donor's location now to collect the batch.
                </p>
              </div>
              <button
                onClick={handleDismissMission}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Donor Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                <p className="text-[9px] font-black text-emerald-400/70 uppercase tracking-widest">Donor Contact</p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-sm font-black">
                    {(acceptedMission.donorId?.name || "?").substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-white">{acceptedMission.donorId?.name || "Anonymous Donor"}</p>
                    <p className="text-emerald-300/70 text-xs font-medium flex items-center mt-0.5">
                      <Mail className="w-3 h-3 mr-1" />
                      {acceptedMission.donorId?.email || "No email on file"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                <p className="text-[9px] font-black text-emerald-400/70 uppercase tracking-widest">Pickup Location</p>
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-white text-sm leading-tight">
                      {acceptedMission.pickupAddress || acceptedMission.city || "Location not specified"}
                    </p>
                    {acceptedMission.city && acceptedMission.pickupAddress && (
                      <p className="text-emerald-300/60 text-xs mt-0.5">{acceptedMission.city}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Batch Details */}
            <div className="flex items-center space-x-4 mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="text-center px-4 border-r border-white/10">
                <p className="text-[9px] font-black text-emerald-400/60 uppercase tracking-widest">Payload</p>
                <p className="text-xl font-black">{acceptedMission.quantity}kg</p>
              </div>
              <div className="text-center px-4 border-r border-white/10">
                <p className="text-[9px] font-black text-emerald-400/60 uppercase tracking-widest">Priority</p>
                <p className="text-xl font-black text-amber-400">{Math.round(acceptedMission.prioritizationRank || 0)}/100</p>
              </div>
              <div className="text-center px-4">
                <p className="text-[9px] font-black text-emerald-400/60 uppercase tracking-widest">Food Type</p>
                <p className="text-sm font-black">{acceptedMission.foodType}</p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {acceptedMission.latitude && acceptedMission.longitude ? (
                <>
                  <a
                    href={`https://www.google.com/maps?q=${acceptedMission.latitude},${acceptedMission.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 h-12 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 transition-all border border-emerald-600/50"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Static Location</span>
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${acceptedMission.latitude},${acceptedMission.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 transition-all border border-white/20"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Directions</span>
                  </a>
                </>
              ) : (
                <div className="flex-1 h-12 rounded-xl bg-white/5 text-white/40 text-[11px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 border border-white/10">
                  <MapPin className="w-4 h-4" />
                  <span>No GPS — Use address above</span>
                </div>
              )}
              {/* 🔴 LIVE LOCATION TRACKER */}
              <a
                href={`/track/${acceptedMission._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 transition-all shadow-lg shadow-rose-900/40"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>Track Donor Live Location</span>
              </a>
              <button
                onClick={handleDismissMission}
                className="sm:w-auto px-6 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-[11px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 transition-all border border-white/10"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Got it</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-xs font-bold flex items-center">
          <Info className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}
      {visibleDonations.length === 0 && !acceptedMission ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-20 text-center">
          <Navigation className="w-10 h-10 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900">No Nearby Batches</h3>
          <p className="text-slate-500 text-sm font-medium mt-1">We'll alert you when surplus matches your operational zone or wait for expiry cycles to complete.</p>
        </div>
      ) : visibleDonations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {visibleDonations.map((donation) => (
            <AvailableCard
              key={donation._id}
              donation={donation}
              onAccept={handleAccept}
              onReject={() => handleReject(donation._id)}
              onReport={() => handleReport(donation._id)}
              onVerify={(vote: 'valid' | 'fake') => handleVerify(donation._id, vote)}
              isProcessing={processingId === donation._id}
              verificationStatus={verificationStatus}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

const AvailableCard = ({
  donation,
  onAccept,
  onReject,
  onReport,
  onVerify,
  isProcessing,
  verificationStatus
}: {
  donation: Donation;
  onAccept: (id: string) => void;
  onReject: () => void;
  onReport: () => void;
  onVerify: (vote: 'valid' | 'fake') => void;
  isProcessing: boolean;
  verificationStatus: string
}) => {
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
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 0) return "Expired";
    if (hours === 0 && mins > 0) return `${mins} mins left`;
    return `${hours}h ${mins}m left`;
  };

  return (
    <div className="premium-card rounded-2xl flex flex-col h-full group overflow-hidden bg-white hover:border-slate-300 transition-all shadow-sm hover:shadow-xl">

      {/* Visual Image Header */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        {donation.foodImage ? (
          <img
            src={donation.foodImage}
            alt="Donation Verification"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
            <Utensils className="w-10 h-10 mb-2 opacity-30" />
            <span className="text-[10px] uppercase font-black tracking-widest">No Visual Auth</span>
          </div>
        )}

        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className={cn(
            "px-2.5 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center shadow-lg backdrop-blur-md bg-white/90",
            getUrgencyStyles(urgencyScore)
          )}>
            <Sparkles className="w-3 h-3 mr-1.5" />
            Priority: {urgencyScore}/100
          </div>

          {/* Feature 4 & 6: AI & EXIF Badges */}
          {donation.imageVerification && (
            <div className="flex flex-col gap-1.5">
              <div className={cn(
                "px-2.5 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center shadow-lg backdrop-blur-md",
                donation.imageVerification.aiConfidence >= 0.75 ? "bg-emerald-500/90 text-white border-emerald-400" : "bg-rose-500/90 text-white border-rose-400"
              )}>
                <ShieldCheck className="w-3 h-3 mr-1.5" />
                AI: {(donation.imageVerification.aiConfidence * 100).toFixed(0)}%
              </div>
              {donation.imageVerification.exifPresent ? (
                <div className="px-2.5 py-1.5 rounded-lg border border-indigo-400 bg-indigo-500/90 text-white text-[10px] font-black uppercase tracking-wider flex items-center shadow-lg backdrop-blur-md">
                  <Camera className="w-3 h-3 mr-1.5" />
                  Camera Verified
                </div>
              ) : (
                <div className="px-2.5 py-1.5 rounded-lg border border-amber-400 bg-amber-500/90 text-white text-[10px] font-black uppercase tracking-wider flex items-center shadow-lg backdrop-blur-md">
                  <ShieldAlert className="w-3 h-3 mr-1.5" />
                  EXIF Missing
                </div>
              )}
            </div>
          )}
        </div>

        {/* Overlay gradient for readability */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent flex items-end p-5">
          <div className="text-white w-full">
            <h4 className="text-xl font-black leading-tight truncate">
              {donation.foodType || "Surplus Batch"}
            </h4>
            <div className="flex items-center text-[11px] font-bold text-white/80 mt-1">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              <span className="truncate">
                {donation.city ? formatCity(donation.city) : "Zone Restricted"}
                {donation.distance !== null && donation.distance !== undefined && (
                  <span className="ml-1 text-emerald-400 font-black">
                    • {donation.distance}km away
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="p-5 flex-1 flex flex-col space-y-4">

        {donation.description && (
          <p className="text-[12px] font-medium text-slate-600 line-clamp-2 leading-relaxed">
            "{donation.description}"
          </p>
        )}

        {/* Feature 1 & 3: Verification Code Display */}
        {donation.verificationCode && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Hash className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/70 text-nowrap">Proof Code</span>
            </div>
            <span className="text-sm font-black text-primary tracking-wider">{donation.verificationCode}</span>
          </div>
        )}

        {/* Timers */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
            <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              <Clock className="w-3 h-3 mr-1" /> Prepared
            </div>
            <p className="text-[11px] font-bold text-slate-700 truncate">
              {donation.preparedTime
                ? new Date(donation.preparedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : "Not specified"}
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
            <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              <div className="flex items-center">
                <Timer className="w-3 h-3 mr-1" /> Expires
              </div>
            </div>
            <p className={cn(
              "text-xs font-black truncate",
              urgencyScore >= 80 ? "text-rose-600" : "text-emerald-600"
            )}>
              {getExpiryDisplay(donation.expiryTime)}
            </p>
          </div>
        </div>

        {/* Donor Footer info */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center text-[10px] font-bold text-slate-500">
            <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-400 flex items-center justify-center mr-2">
              <User className="w-3 h-3" />
            </div>
            <span className="truncate max-w-[120px]">{donation.donorId?.name || "Anonymous"}</span>
          </div>
          <div className="flex items-center text-[10px] font-black text-slate-700">
            {donation.quantity}kg Payload
          </div>
        </div>
      </div>

      {/* Action Decision Engine */}
      <div className="p-2 gap-2 flex flex-col bg-slate-50 border-t border-slate-100">
        {/* Feature 7: NGO Human Verification Voting */}
        <div className="px-2 py-1 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <div className="flex -space-x-1.5 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-slate-200" />
              ))}
            </div>
            <span className="text-[9px] font-bold text-slate-500 ml-1">
              {donation.ngoVerification?.length || 0} Peer Reviews
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onVerify('valid')}
              className="p-1.5 h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-colors flex items-center justify-center"
              title="Legitimate Food Image"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onVerify('fake')}
              className="p-1.5 h-8 w-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors flex items-center justify-center"
              title="Flag as Suspicious/Fake"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 w-full">
          {verificationStatus !== "approved" ? (
            <div className="w-full h-11 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center space-x-2 text-amber-700 m-2">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Account under verification</span>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={onReport}
                title="Report Fraud"
                className="h-12 w-12 shrink-0 rounded-xl border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 p-0"
              >
                <AlertTriangle className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={onReject}
                title="Hide this donation"
                className="h-12 w-12 shrink-0 rounded-xl border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-white p-0"
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => onAccept(donation._id)}
                disabled={isProcessing}
                className="flex-1 h-12 rounded-xl text-xs font-black shadow-[0_4px_14px_0_rgba(16,185,129,0.2)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-all bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center space-x-2"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

