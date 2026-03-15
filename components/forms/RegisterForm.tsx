"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setToken } from "@/lib/auth";
import { postRequest } from "@/lib/apiClient";
import { useSearchParams, useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  ChevronRight,
  Loader2,
  AlertCircle,
  Building2,
  Heart,
  Globe,
  MapPin,
  Target,
  Navigation,
  Phone,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

export const RegisterForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryRole = searchParams.get("role");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: queryRole === "ngo" ? "ngo" : "donor",
    address: "",
    city: "",
    state: "",
    pincode: "",
    ngoRegNo: "",
    category: "",
    contactPhone: "",
    latitude: null as number | null,
    longitude: null as number | null
  });
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (queryRole === "ngo" || queryRole === "donor") {
      setFormData(prev => ({ ...prev, role: queryRole }));
    }
  }, [queryRole]);

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
      setError("Location access denied.");
      setLocationLoading(false);
    });
  };

  const handleSendOtp = async () => {
    if (!formData.phone) {
      setError("Please enter a phone number first.");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await postRequest("/api/auth/send-otp", { phone: formData.phone });
      if (res.success) {
        setIsOtpSent(true);
        setError("");
        // Alert removed for real SMS delivery
      }
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;
    setOtpLoading(true);
    try {
      const res = await postRequest("/api/auth/verify-otp", { phone: formData.phone, otp });
      if (res.success) {
        setIsPhoneVerified(true);
        setIsOtpSent(false);
        setError("");
      }
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // --- Client Side Validation ---
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (!isPhoneVerified) {
      setError("Please verify your phone number using OTP first.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Security Key must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (formData.role === "ngo" && !formData.category) {
      setError("Please select an NGO category.");
      setLoading(false);
      return;
    }

    // Pincode validation (numeric and standard length)
    if (formData.pincode && !/^\d{5,6}$/.test(formData.pincode)) {
      setError("Please enter a valid 5 or 6 digit Pincode / Zip.");
      setLoading(false);
      return;
    }

    try {
      const result = await postRequest("/api/auth/register", formData);
      if (result.success) {
        router.push("/login?registered=true");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={formRef} className="glass-card rounded-[3rem] border-none p-10 lg:p-16 bg-white shadow-[0_32px_120px_-20px_rgba(0,0,0,0.1)] relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-tr-full -ml-16 -mb-16 pointer-events-none" />

      <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
        {/* Role Selection */}
        <div className="space-y-4 relative z-20">
          <label className="text-xs font-black text-gray-600 uppercase tracking-widest text-center block">Access Tier Selection</label>
          <div className="grid grid-cols-2 gap-4">
            <RoleCard
              active={formData.role === "donor"}
              onClick={() => setFormData(prev => ({ ...prev, role: "donor" }))}
              icon={<Heart className="w-5 h-5 pointer-events-none" />}
              title="Donor"
              desc="Business/Indiv."
            />
            <RoleCard
              active={formData.role === "ngo"}
              onClick={() => setFormData(prev => ({ ...prev, role: "ngo" }))}
              icon={<Building2 className="w-5 h-5 pointer-events-none" />}
              title="Verified NGO"
              desc="Impact Org."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <InputField
            label={formData.role === "ngo" ? "Official NGO Name" : "Full Name / Organization"}
            icon={<User className="w-4 h-4" />}
            placeholder={formData.role === "ngo" ? "Better World Foundation" : "John Doe / Food Bank"}
            value={formData.name}
            onChange={(val) => setFormData({ ...formData, name: val })}
            className="reg-item"
          />
          <InputField
            label="Corporate Email"
            icon={<Mail className="w-4 h-4" />}
            type="email"
            placeholder="name@company.com"
            value={formData.email}
            onChange={(val) => setFormData({ ...formData, email: val })}
            className="reg-item"
          />
          <InputField
            label="Phone Number"
            icon={<Phone className="w-4 h-4" />}
            type="tel"
            placeholder="+1 555-0100"
            value={formData.phone}
            onChange={(val) => setFormData({ ...formData, phone: val })}
            className="reg-item"
            action={
              !isPhoneVerified && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading || !formData.phone}
                  className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest disabled:opacity-30"
                >
                  {otpLoading ? "Sending..." : "Send OTP"}
                </button>
              )
            }
          />

          {isOtpSent && !isPhoneVerified && (
            <div className="md:col-span-2 space-y-3 reg-item animate-in slide-in-from-top duration-300">
              <InputField
                label="Enter 6-Digit OTP"
                icon={<ShieldCheck className="w-4 h-4" />}
                placeholder="000000"
                value={otp}
                onChange={(val) => setOtp(val)}
                action={
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otp.length < 6}
                    className="text-[10px] font-black text-emerald-600 hover:underline uppercase tracking-widest disabled:opacity-30"
                  >
                    Verify OTP
                  </button>
                }
              />
            </div>
          )}

          {isPhoneVerified && (
            <div className="md:col-span-2 flex items-center space-x-2 p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 reg-item">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Phone Verified Successfully</span>
            </div>
          )}

          <InputField
            label="Security Key"
            icon={<Lock className="w-4 h-4" />}
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(val) => setFormData({ ...formData, password: val })}
            className="reg-item"
          />
          <InputField
            label="Confirm Password"
            icon={<Lock className="w-4 h-4" />}
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(val) => setFormData({ ...formData, confirmPassword: val })}
            className="reg-item"
          />

          {formData.role === "ngo" && (
            <>
              <InputField
                label="NGO Registration #"
                icon={<ShieldCheck className="w-4 h-4" />}
                placeholder="REG-2024-XXXX"
                value={formData.ngoRegNo}
                onChange={(val) => setFormData({ ...formData, ngoRegNo: val })}
                className="reg-item"
              />
              <InputField
                label="Public Contact Phone"
                icon={<Phone className="w-4 h-4" />}
                type="tel"
                placeholder="+1 555-0100"
                value={formData.contactPhone}
                onChange={(val) => setFormData({ ...formData, contactPhone: val })}
                className="reg-item"
              />
              <div className="space-y-3 reg-item">
                <label className="text-xs font-black text-gray-600 uppercase tracking-widest flex items-center">
                  <span className="opacity-40 mr-2"><Globe className="w-4 h-4" /></span>
                  NGO Category
                </label>
                <select
                  className="w-full h-14 rounded-[1.25rem] bg-white border-2 border-slate-900 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-black px-4 text-slate-900"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  value={formData.category}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Food Bank">Food Bank</option>
                  <option value="Shelter">Shelter</option>
                  <option value="Disaster Relief">Disaster Relief</option>
                  <option value="Community Kitchen">Community Kitchen</option>
                </select>
              </div>
            </>
          )}

          <InputField
            label="Base City"
            icon={<Globe className="w-4 h-4" />}
            placeholder="San Francisco"
            value={formData.city}
            onChange={(val: string) => setFormData({ ...formData, city: val })}
            className="reg-item"
          />
          <InputField
            label="Pincode / Zip"
            icon={<MapPin className="w-4 h-4" />}
            placeholder="94103"
            value={formData.pincode}
            onChange={(val: string) => setFormData({ ...formData, pincode: val })}
            className="reg-item"
          />

          <div className="md:col-span-2">
            <InputField
              label={formData.role === "ngo" ? "NGO Head Office Address" : "Operational Address"}
              icon={<MapPin className="w-4 h-4" />}
              placeholder={formData.role === "ngo" ? "NGO Hub, 4th Floor..." : "123 Sustainability Ave..."}
              value={formData.address}
              onChange={(val: string) => setFormData({ ...formData, address: val })}
              className="reg-item"
              action={
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={locationLoading}
                  className="flex items-center space-x-1.5 text-primary hover:text-primary/80 transition-colors group"
                >
                  {locationLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Target className="w-3 h-3 group-hover:scale-110 transition-transform" />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-wider">Locate Me</span>
                </button>
              }
            />
          </div>
        </div>

        {error && (
          <div className="reg-item flex items-center space-x-3 p-5 bg-red-50 text-red-600 rounded-[1.5rem] border border-red-100">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        <div className="reg-item pt-4 space-y-6">
          <Button
            type="submit"
            disabled={loading || !isPhoneVerified}
            className="w-full h-16 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white text-xl font-black shadow-2xl shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:grayscale"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <span>Create Platform Account</span>
                <ChevronRight className="w-6 h-6" />
              </>
            )}
          </Button>

          <div className="flex items-center space-x-4">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">OR</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <Button
            type="button"
            onClick={() => signIn("google", { callbackUrl: `/complete-profile?role=${formData.role}` })}
            className="w-full h-16 rounded-[1.5rem] bg-white border-2 border-slate-900 text-slate-900 text-lg font-black hover:bg-slate-50 transition-all flex items-center justify-center space-x-3 shadow-lg"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            <span>Continue with Google</span>
          </Button>
        </div>

        <div className="reg-item text-center text-sm font-bold text-gray-600">
          Already have an account? <a href="/login" className="text-primary hover:underline font-black">Sign in now</a>
        </div>
      </form>
    </div>
  );
};

const RoleCard = ({ active, onClick, icon, title, desc }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string, desc: string }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center space-y-2 group cursor-pointer relative z-30",
      active ? "bg-blue-50/50 border-blue-600 shadow-xl shadow-blue-500/10" : "bg-gray-50/50 border-gray-100 hover:border-gray-200"
    )}
  >
    <div className={cn(
      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors pointer-events-none",
      active ? "bg-blue-600 text-white" : "bg-white text-gray-500 group-hover:bg-gray-100"
    )}>
      {icon}
    </div>
    <div className="space-y-0.5 pointer-events-none">
      <span className={cn("text-sm font-black tracking-tight", active ? "text-gray-900" : "text-gray-600")}>{title}</span>
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">{desc}</span>
    </div>
  </button>
);

const InputField = ({ label, icon, placeholder, value, onChange, type = "text", className, action }: { label: string; icon: React.ReactNode; placeholder: string; value: string; onChange: (val: string) => void; type?: string; className?: string; action?: React.ReactNode }) => (
  <div className={cn("space-y-3", className)}>
    <div className="flex items-center justify-between">
      <label className="text-xs font-black text-gray-600 uppercase tracking-widest flex items-center">
        <span className="opacity-40 mr-2">{icon}</span>
        {label}
      </label>
      {action}
    </div>
    <div className="relative">
      <Input
        type={type}
        placeholder={placeholder}
        className="h-14 rounded-[1.25rem] bg-white border-2 border-slate-900 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-black pr-12 text-slate-900"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
        <Navigation className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  </div>
);
