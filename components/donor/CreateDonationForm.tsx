"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postRequest } from "@/lib/apiClient";
import {
  Package,
  MapPin,
  Calendar,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Utensils,
  Navigation,
  Target,
  Box,
  Globe,
  Camera,
  Image as ImageIcon,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Hash,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Feature 1: Generate Verification Code ---
function generateVerificationCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `FOD-${num}`;
}

export const CreateDonationForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [formData, setFormData] = useState({
    foodItem: "",
    quantity: "",
    preparedTime: "",
    expiryDate: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    description: "",
    latitude: null as number | null,
    longitude: null as number | null
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // --- Feature 1 & 3: Verification Code State ---
  const [verificationCode] = useState<string>(generateVerificationCode);

  // --- Feature 6: EXIF Status ---
  const [exifStatus, setExifStatus] = useState<'none' | 'present' | 'suspicious'>('none');
  const [exifData, setExifData] = useState<any>(null);

  // --- Feature 4: AI Status ---
  const [aiStatus, setAiStatus] = useState<string>('');
  const [aiConfidence, setAiConfidence] = useState<number>(0);
  const [aiCategory, setAiCategory] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setExifStatus('none');
      setAiStatus('');
      setError("");
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
        const data = await res.json();

        if (data.address) {
          const address = data.display_name;
          const city = data.address.city || data.address.town || data.address.village || data.address.suburb || "";

          setFormData(prev => ({
            ...prev,
            address: address,
            city: city,
            latitude: latitude,
            longitude: longitude
          }));
        }
      } catch (err) {
        setError("Failed to resolve address. Please enter manually.");
      } finally {
        setLocationLoading(false);
      }
    }, () => {
      setError("Permission denied or location unavailable.");
      setLocationLoading(false);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // --- Client Side Validation ---
    if (!imageFile) {
      setError("A photo of the food with the verification code is required.");
      setLoading(false);
      return;
    }

    const qty = Number(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Quantity must be a positive number.");
      setLoading(false);
      return;
    }

    const expiryDate = new Date(formData.expiryDate);
    const preparedDate = new Date(formData.preparedTime);
    const now = new Date();

    if (expiryDate <= now) {
      setError("Expiry date must be in the future.");
      setLoading(false);
      return;
    }

    if (preparedDate > expiryDate) {
      setError("Prepared time cannot be after expiry time.");
      setLoading(false);
      return;
    }

    if (!formData.description) {
      setError("Please provide a description of the items.");
      setLoading(false);
      return;
    }

    if (!formData.state || !formData.pincode) {
      setError("Strategic location details (State and Pincode) are required.");
      setLoading(false);
      return;
    }

    try {
      // 1. Upload Image + EXIF Extraction
      setAiStatus('uploading');
      const imageFormData = new FormData();
      imageFormData.append("image", imageFile);

      const uploadRes = await fetch('/api/donations/upload-image', {
        method: 'POST',
        body: imageFormData
      });
      const uploadData = await uploadRes.json();

      if (!uploadData.success || !uploadData.data?.imageUrl) {
        throw new Error("Image upload failed. Please try again.");
      }

      const finalImageUrl = uploadData.data.imageUrl;

      // Feature 6: Process EXIF result
      if (uploadData.data.exifPresent) {
        setExifStatus('present');
        setExifData(uploadData.data.exifData);
      } else {
        setExifStatus('suspicious');
      }

      // 2. AI Food Detection
      setAiStatus('scanning');
      const aiRes = await postRequest("/api/ml/detect-food", {
        imageUrl: finalImageUrl,
        claimedCategory: formData.foodItem
      });
      if (!aiRes.success) {
        setAiStatus('rejected');
        throw new Error(aiRes.error || "AI rejected this image. Please upload a valid food image.");
      }

      setAiStatus('verified');
      setAiConfidence(aiRes.data?.confidence || 0);
      setAiCategory(aiRes.data?.category || '');

      // 3. Final Form Submission with verification data
      const finalConfidence = aiRes.data?.confidence || aiConfidence || 0;
      const finalCategoryName = aiRes.data?.category || aiCategory || '';

      const payload = {
        foodType: formData.foodItem,
        quantity: formData.quantity,
        preparedTime: formData.preparedTime,
        expiryTime: formData.expiryDate,
        pickupAddress: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        description: formData.description,
        latitude: formData.latitude,
        longitude: formData.longitude,
        foodImage: finalImageUrl,
        verificationCode: verificationCode,
        imageVerification: {
          aiConfidence: finalConfidence,
          aiCategory: finalCategoryName,
          exifPresent: uploadData.data.exifPresent || false,
          exifData: uploadData.data.exifData || {},
          isSuspicious: uploadData.data.isSuspicious || false,
        }
      };

      console.log("[DONATION-CREATE] Sending payload:", JSON.stringify(payload, null, 2));

      const result = await postRequest("/api/donations/create", payload);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
        }, 3000);
      } else {
        throw new Error(result.error || "Failed to list donation");
      }
    } catch (err: any) {
      setError(err.message || "Failed to list donation");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 rounded-2xl p-12 text-center shadow-sm animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center border border-emerald-100 dark:border-emerald-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">AI Verified & Registered</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold max-w-xs mx-auto text-sm">
            Multi-layer verification passed. AI redistribution matching is now active for this batch.
          </p>
          {aiCategory && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-primary/5 rounded-full">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-black text-primary uppercase tracking-wider">
                {aiCategory} — {(aiConfidence * 100).toFixed(0)}% Confidence
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900 dark:bg-slate-950 p-10 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
          <Box className="w-32 h-32" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mb-4">
            <UtensilsIcon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-2xl font-black tracking-tight">Initiate Surplus Ledger</h3>
          <p className="text-slate-400 font-bold text-sm">Multi-layer verified food donation with AI proof system.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-8">

        {/* --- Feature 1 & 3: Verification Code Banner --- */}
        <div className="relative bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 border-2 border-dashed border-primary/30 rounded-2xl p-6 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Hash className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Verification Code</p>
              <p className="text-3xl font-black text-primary tracking-wider">{verificationCode}</p>
            </div>
          </div>
          <div className="flex items-start space-x-2 mt-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="text-amber-600 dark:text-amber-400 font-black">Required:</span> Write this code on a piece of paper and place it next to the food while taking the photo. This prevents the use of downloaded or old images.
            </p>
          </div>
        </div>

        {/* --- Feature 2 & 3: Camera Capture with Instructions --- */}
        <div className="space-y-4">
          <FormGroup label="Contextual Proof Photo (Required)" icon={<Camera className="w-4 h-4" />}>
            <div className="mt-2">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageChange}
              />

              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-44 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/50"
                >
                  <Camera className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs font-black uppercase tracking-wider">Tap to Capture Photo</span>
                  <span className="text-[10px] font-bold opacity-60 mt-1">Make sure <span className="text-primary font-black">{verificationCode}</span> is visible in the photo</span>
                </div>
              ) : (
                <div className="relative w-full rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 group">
                  <img src={imagePreview} alt="Food Preview" className="w-full h-48 object-cover" />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Retake Photo
                    </Button>
                  </div>

                  {/* Feature 6: EXIF Status Badge */}
                  {exifStatus !== 'none' && (
                    <div className={cn(
                      "absolute top-3 right-3 flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-sm",
                      exifStatus === 'present'
                        ? "bg-emerald-500/90 text-white"
                        : "bg-amber-500/90 text-white"
                    )}>
                      {exifStatus === 'present' ? (
                        <><ShieldCheck className="w-3.5 h-3.5" /> Camera Verified</>
                      ) : (
                        <><ShieldAlert className="w-3.5 h-3.5" /> No EXIF — Suspicious</>
                      )}
                    </div>
                  )}

                  {/* AI Status Badge */}
                  {aiStatus && (
                    <div className={cn(
                      "absolute bottom-3 left-3 flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-sm",
                      aiStatus === 'uploading' && "bg-blue-500/90 text-white",
                      aiStatus === 'scanning' && "bg-indigo-500/90 text-white",
                      aiStatus === 'verified' && "bg-emerald-500/90 text-white",
                      aiStatus === 'rejected' && "bg-rose-500/90 text-white",
                    )}>
                      {aiStatus === 'uploading' && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>}
                      {aiStatus === 'scanning' && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> AI Scanning...</>}
                      {aiStatus === 'verified' && <><Sparkles className="w-3.5 h-3.5" /> AI Verified ({(aiConfidence * 100).toFixed(0)}%)</>}
                      {aiStatus === 'rejected' && <><AlertCircle className="w-3.5 h-3.5" /> AI Rejected</>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </FormGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormGroup label="Asset Category" icon={<Package className="w-4 h-4" />}>
            <Input
              placeholder="e.g. Fresh Produce"
              className="h-12 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-primary/5 transition-all font-black text-xs text-slate-900 dark:text-white"
              value={formData.foodItem}
              onChange={(e) => setFormData({ ...formData, foodItem: e.target.value })}
              required
            />
          </FormGroup>

          <FormGroup label="Payload (kg/units)" icon={<Box className="w-4 h-4" />}>
            <Input
              type="number"
              placeholder="0.00"
              className="h-12 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-primary/5 transition-all font-black text-xs text-slate-900 dark:text-white"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
            />
          </FormGroup>

          <div className="md:col-span-2">
            <FormGroup label="Asset Description" icon={<Box className="w-4 h-4" />}>
              <Input
                placeholder="e.g. 10 kg of tomatoes, 5 kg of onions"
                className="h-12 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-primary/5 transition-all font-black text-xs text-slate-900 dark:text-white"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </FormGroup>
          </div>

          <FormGroup label="Food Prepared At (Time)" icon={<Clock className="w-4 h-4" />}>
            <Input
              type="datetime-local"
              className="h-12 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-primary/5 transition-all font-black text-xs text-slate-900 dark:text-white"
              value={formData.preparedTime}
              onChange={(e) => setFormData({ ...formData, preparedTime: e.target.value })}
              required
            />
          </FormGroup>

          <FormGroup label="Best Before (Expiry Time)" icon={<Calendar className="w-4 h-4" />}>
            <Input
              type="datetime-local"
              className="h-12 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-primary/5 transition-all font-black text-xs text-slate-900 dark:text-white"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              required
            />
          </FormGroup>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:col-span-2">
            <FormGroup label="Strategic City" icon={<MapPin className="w-4 h-4" />}>
              <Input
                placeholder="Pickup City"
                className="h-12 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-primary/5 transition-all font-black text-xs text-slate-900 dark:text-white"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </FormGroup>

            <FormGroup label="Strategic State" icon={<Globe className="w-4 h-4" />}>
              <Input
                placeholder="State"
                className="h-12 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-primary/5 transition-all font-black text-xs text-slate-900 dark:text-white"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
              />
            </FormGroup>

            <FormGroup label="Zip / Pincode" icon={<Navigation className="w-4 h-4" />}>
              <Input
                placeholder="Pincode"
                className="h-12 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-primary/5 transition-all font-black text-xs text-slate-900 dark:text-white"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                required
              />
            </FormGroup>
          </div>

          <div className="md:col-span-2">
            <FormGroup
              label="Collection Coordinate"
              icon={<MapPin className="w-4 h-4" />}
              action={
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={locationLoading}
                  className="flex items-center space-x-1.5 text-primary hover:text-primary/80 transition-colors group"
                >
                  {locationLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Target className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  )}
                  <span className="text-[9px] font-black uppercase tracking-widest">Geo-Locate</span>
                </button>
              }
            >
              <div className="relative">
                <Input
                  placeholder="Street Address, Suite / Room"
                  className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-primary/5 transition-all font-bold text-xs pr-12 text-slate-700 dark:text-white"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                  <Navigation className="w-4 h-4" />
                </div>
              </div>
            </FormGroup>
          </div>
        </div>

        {error && (
          <div className="flex items-center space-x-3 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-800 italic font-bold text-xs">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/10 hover:shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Submit for Multi-Layer Verification</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

const FormGroup = ({ label, icon, children, action }: { label: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) => (
  <div className="space-y-2.5">
    <div className="flex items-center justify-between">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
        <span className="opacity-50">{icon}</span>
        <span>{label}</span>
      </label>
      {action}
    </div>
    {children}
  </div>
);

const UtensilsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20m14-7V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v7" /></svg>
);
