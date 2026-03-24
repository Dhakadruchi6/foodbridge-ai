"use client";

import { useState, useEffect, useRef } from "react";
import { signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveToken } from "@/lib/auth";
import { postRequest } from "@/lib/apiClient";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";
import Image from "next/image";

export const LoginForm = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animations removed for stability
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      const result = await postRequest("/api/auth/login", formData);
      if (result.success || result.token) {
        // Clear any stale Google OAuth session to prevent it from overriding the role
        await signOut({ redirect: false }).catch(() => { });

        // Use the unified saveToken helper (handles Cookies + LocalStorage)
        saveToken(result.token);
        localStorage.setItem("role", result.role);

        console.log("Logged in role:", result.role);

        // Role-based redirect
        if (result.role === "donor") {
          window.location.href = "/dashboard/donor";
        } else if (result.role === "ngo") {
          window.location.href = "/dashboard/ngo";
        } else if (result.role === "admin") {
          window.location.href = "/dashboard/admin";
        }
      }
    } catch (err: unknown) {
      // STEP 7: Error handling string match
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={formRef} className="glass-card rounded-[2.5rem] border-none p-10 lg:p-12 bg-white shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 group-hover:w-40 group-hover:h-40 transition-all duration-700" />

      <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
        <div className="space-y-6">
          <div className="form-item space-y-2">
            <label className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center">
              <Mail className="w-4 h-4 mr-2 text-gray-500" />
              Email Address
            </label>
            <Input
              type="email"
              placeholder="name@company.com"
              className="h-14 rounded-2xl bg-white border-2 border-slate-900 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-black text-slate-900"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-item space-y-2">
            <label className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center justify-between">
              <div className="flex items-center">
                <Lock className="w-4 h-4 mr-2 text-gray-500" />
                Password
              </div>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-14 rounded-2xl bg-white border-2 border-slate-900 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-black pr-12 text-slate-900"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="form-item flex items-center space-x-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 animate-in slide-in-from-top duration-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        <div className="form-item pt-2 space-y-6">
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-16 rounded-[1.25rem] bg-blue-600 hover:bg-blue-700 text-white text-xl font-black shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <span>Secure Sign In</span>
                <ArrowRight className="w-6 h-6" />
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
            onClick={() => signIn("google", { callbackUrl: "/complete-profile" })}
            className="w-full h-16 rounded-[1.25rem] bg-white border-2 border-slate-900 text-slate-900 text-lg font-black hover:bg-slate-50 transition-all flex items-center justify-center space-x-3 shadow-lg"
          >
            <Image src="https://www.google.com/favicon.ico" width={20} height={20} alt="Google" className="w-5 h-5" />
            <span>Continue with Google</span>
          </Button>
        </div>

        <div className="form-item flex flex-col items-center space-y-4 text-sm font-bold text-gray-600">
          <div>
            Need a partner account? <a href="/register" className="text-primary hover:underline underline-offset-4 font-black">Register here</a>
          </div>
          <a href="/forgot-password" className="text-slate-400 hover:text-primary transition-colors text-xs uppercase tracking-widest font-black">
            Trouble logging in? Reset Keys
          </a>
        </div>
      </form>
    </div>
  );
};
