"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
  ArrowRight,
  Zap,
  Shield,
  Target,
  ChevronRight,
  TrendingUp,
  Package,
  Heart,
  Globe2,
  Leaf,
  Building2
} from "lucide-react";
import { getRequest } from "@/lib/apiClient";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [globalStats, setGlobalStats] = useState<any>(null);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const result = await getRequest("/api/analytics/global");
        if (result.success) setGlobalStats(result.data);
      } catch (err) {
        console.error("Failed to fetch global stats", err);
      }
    };
    fetchGlobalStats();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Entrance
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.fromTo(".hero-badge", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 })
        .fromTo(".hero-title-line", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.1 }, "-=0.4")
        .fromTo(".hero-desc", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, "-=0.6")
        .fromTo(".hero-actions", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, "-=0.6");

      // Scroll animations
      gsap.utils.toArray('.stagger-fade-up').forEach((el: any) => {
        gsap.fromTo(el,
          { y: 60, opacity: 0 },
          {
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
            },
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out"
          }
        );
      });

      gsap.fromTo(".feature-card",
        { y: 80, opacity: 0, rotation: 2 },
        {
          scrollTrigger: {
            trigger: ".feature-grid",
            start: "top 80%",
          },
          y: 0,
          opacity: 1,
          rotation: 0,
          duration: 1,
          stagger: 0.15,
          ease: "back.out(1.2)"
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen hero-mesh overflow-hidden selection:bg-primary/30">
      {/* Subtle grid pattern overlay */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03] pointer-events-none" />

      <div className="relative z-10 pt-32 pb-24 lg:pt-48 lg:pb-32 px-6">
        <div className="container max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-12 max-w-4xl mx-auto">

            <div className="hero-badge inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-white/40 backdrop-blur-xl border border-white/40 shadow-2xl shadow-primary/10">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Global Food Recovery Network</span>
            </div>

            <div className="space-y-4">
              <h1 className="hero-title-line text-6xl sm:text-8xl lg:text-[100px] font-black tracking-tighter text-slate-900 leading-[0.85] text-balance">
                Redefining <span className="text-primary italic">Waste</span> <br />
                into <span className="relative">
                  Impact
                  <svg className="absolute w-full h-4 -bottom-2 left-0 text-primary/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="6" fill="none" />
                  </svg>
                </span>
              </h1>
            </div>

            <p className="hero-desc text-lg sm:text-2xl text-slate-600 font-bold leading-relaxed max-w-2xl text-balance">
              Automated food redistribution powered by AI. Connecting corporate surplus with verified NGOs in real-time.
            </p>

            <div className="hero-actions flex flex-col sm:flex-row items-center gap-6 pt-8 w-full sm:w-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <Link href="/register?role=donor" className="group">
                  <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl hover:scale-105 hover:bg-slate-800 transition-all cursor-pointer relative overflow-hidden h-full">
                    <div className="absolute top-0 right-0 p-4 opacity-20"><Heart className="w-12 h-12" /></div>
                    <h3 className="text-2xl font-black mb-2 flex items-center text-white">Donate <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-2 transition-transform" /></h3>
                    <p className="text-slate-400 font-bold text-sm">For Businesses & Restaurants</p>
                  </div>
                </Link>
                <Link href="/register?role=ngo" className="group">
                  <div className="p-8 rounded-[2.5rem] bg-white text-slate-900 shadow-2xl border border-white/50 hover:scale-105 transition-all cursor-pointer relative overflow-hidden h-full">
                    <div className="absolute top-0 right-0 p-4 opacity-20 text-primary"><Building2 className="w-12 h-12" /></div>
                    <h3 className="text-2xl font-black mb-2 flex items-center text-primary">Receive <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-2 transition-transform" /></h3>
                    <p className="text-slate-500 font-bold text-sm">For Verified Non-Profits</p>
                  </div>
                </Link>
              </div>
            </div>

            <div className="hero-actions flex items-center space-x-8 pt-12 border-t border-slate-200/50 w-full justify-center">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-14 h-14 rounded-full border-4 border-white bg-slate-200 shadow-lg overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?u=${i}`} alt="Partner" />
                  </div>
                ))}
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-slate-900 leading-none mb-1 uppercase tracking-widest">500+ Verified Partners</p>
                <p className="text-xs font-bold text-slate-500">Joining the fight against food insecurity</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Impact Marquee */}
      <div className="w-full bg-slate-900 overflow-hidden py-6 border-y border-slate-800">
        <div className="flex whitespace-nowrap animate-[marquee_25s_linear_infinite] opacity-50">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center space-x-12 mx-6 text-white text-xl font-black tracking-widest uppercase">
              <span>San Francisco</span>
              <span className="text-primary">•</span>
              <span>New York</span>
              <span className="text-primary">•</span>
              <span>London</span>
              <span className="text-primary">•</span>
              <span>Toronto</span>
              <span className="text-primary">•</span>
              <span>Sydney</span>
              <span className="text-primary">•</span>
              <span>Tokyo</span>
              <span className="text-primary">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Section */}
      <section id="features" className="w-full py-32 px-6">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center space-y-6 mb-24 max-w-3xl mx-auto stagger-fade-up">
            <span className="text-xs font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-full">The Technology</span>
            <h2 className="text-4xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[0.95]">
              Intelligence that <br />
              <span className="text-primary">actually works.</span>
            </h2>
            <p className="text-xl text-slate-600 font-medium leading-relaxed">
              We've combined geospatial mapping, machine learning matching, and predictive analytics to create the definitive food recovery network.
            </p>
          </div>

          <div className="feature-grid grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Target className="w-8 h-8 text-primary" />}
              title="Instant ML Matching"
              description="Our model analyzes donor distance, food quantity, and NGO capacity to find the perfect fit in milliseconds, preventing perishables from spoiling."
              colorClass="bg-primary"
              glowClass="shadow-primary/20"
            />
            <FeatureCard
              icon={<Globe2 className="w-8 h-8 text-blue-500" />}
              title="Geospatial Routing"
              description="Automated routing and live radius tracking ensures that collections are logistically viable and carbon-efficient for all participating transport teams."
              colorClass="bg-blue-500"
              glowClass="shadow-blue-500/20"
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-emerald-500" />}
              title="Verified Ecosystem"
              description="Rigorous onboarding and continuous compliance monitoring for NGOs and donors ensures a safe, legally sound environment for massive scale operations."
              colorClass="bg-emerald-500"
              glowClass="shadow-emerald-500/20"
            />
          </div>
        </div>
      </section>

      {/* Network Section */}
      <section id="network" className="w-full py-32 px-6 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <div className="container max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8 stagger-fade-up">
              <span className="text-xs font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-full ring-1 ring-primary/20">The Ecosystem</span>
              <h2 className="text-5xl lg:text-7xl font-black tracking-tight text-white leading-[0.9]">
                Connecting the <br />
                <span className="text-primary italic">Global Grid.</span>
              </h2>
              <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-xl">
                Our network consists of verified partners across 4 continents. Every node represents a commitment to zero-waste operational excellence.
              </p>

              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-sm">
                  <p className="text-4xl font-black text-white mb-1">{globalStats?.donorCount || 0}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Donors</p>
                </div>
                <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-sm">
                  <p className="text-4xl font-black text-white mb-1">{globalStats?.ngoCount || 0}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Verified NGOs</p>
                </div>
              </div>
            </div>

            <div className="relative aspect-square">
              <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full animate-pulse" />
              <div className="relative z-10 w-full h-full bg-slate-800/50 rounded-[3rem] border border-white/10 backdrop-blur-xl p-8 overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

                {/* Stylized Network Nodes */}
                <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 animate-in slide-in-from-right duration-500">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                      <span className="text-xs font-black text-white">Global Relief Fdn</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">PHAGWARA, IN</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/5 ml-8 animate-in slide-in-from-right delay-150 duration-500">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                      <span className="text-xs font-black text-white">Urban Harvest HQ</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">JALANDHAR, IN</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 animate-in slide-in-from-right delay-300 duration-500">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_#2563eb]" />
                      <span className="text-xs font-black text-white">Grand Plaza Hotel</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">DONOR • ONLINE</span>
                  </div>
                </div>

                <div className="absolute bottom-8 left-8 right-8 p-6 bg-primary/20 rounded-[2rem] border border-primary/30 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Globe2 className="w-5 h-5 text-primary" />
                      <span className="text-sm font-black text-white">Live Operations</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Scanning Grid...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="w-full py-32 px-6 bg-white">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center space-y-6 mb-24 max-w-3xl mx-auto stagger-fade-up">
            <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full">Environmental ROI</span>
            <h2 className="text-5xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[0.95]">
              Real change. <br />
              <span className="text-emerald-500 italic">By the numbers.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-12 rounded-[3.5rem] bg-slate-50 border border-slate-100 flex flex-col items-center text-center space-y-4 hover:bg-emerald-50 hover:border-emerald-100 transition-all duration-500 group">
              <div className="p-4 bg-white rounded-3xl shadow-xl shadow-emerald-500/10 group-hover:scale-110 transition-transform"><Package className="w-10 h-10 text-emerald-500" /></div>
              <h3 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter">{globalStats?.totalKg || 0}kg</h3>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Total Food Recovered</p>
            </div>
            <div className="p-12 rounded-[3.5rem] bg-slate-50 border border-slate-100 flex flex-col items-center text-center space-y-4 hover:bg-blue-50 hover:border-blue-100 transition-all duration-500 group">
              <div className="p-4 bg-white rounded-3xl shadow-xl shadow-blue-500/10 group-hover:scale-110 transition-transform"><Leaf className="w-10 h-10 text-blue-500" /></div>
              <h3 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter">{globalStats?.co2Mitigated || 0}t</h3>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">CO2 Emissions Mitigated</p>
            </div>
            <div className="p-12 rounded-[3.5rem] bg-slate-50 border border-slate-100 flex flex-col items-center text-center space-y-4 hover:bg-amber-50 hover:border-amber-100 transition-all duration-500 group">
              <div className="p-4 bg-white rounded-3xl shadow-xl shadow-amber-500/10 group-hover:scale-110 transition-transform"><TrendingUp className="w-10 h-10 text-amber-500" /></div>
              <h3 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter">{(Number(globalStats?.totalKg || 0) * 1.4).toFixed(0)}</h3>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Total Meals Provided</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full px-6 py-20 mb-20">
        <div className="container max-w-6xl mx-auto">
          <div className="stagger-fade-up w-full rounded-[3rem] p-12 lg:p-24 overflow-hidden relative group bg-slate-900 border border-slate-800 shadow-2xl">
            <div className="relative z-10 flex flex-col items-center text-center space-y-10">
              <h2 className="text-5xl lg:text-7xl font-black tracking-tight text-white leading-[0.9]">
                Stop throwing away <br />
                <span className="text-primary italic">your potential.</span>
              </h2>
              <p className="text-xl text-slate-300 font-medium max-w-2xl">
                Whether you're a grocery chain with daily surplus or an NGO feeding communities, FoodBridge is your operational backbone.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 pt-6 w-full sm:w-auto">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="h-16 px-12 text-lg font-black bg-white text-slate-900 hover:bg-slate-100 rounded-[1.25rem] transition-all">
                    Register Now
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="h-16 px-12 text-lg font-black text-white border-2 border-white/20 bg-white/5 hover:bg-white/10 rounded-[1.25rem] transition-all">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="w-full py-12 border-t border-slate-200 bg-white text-center">
        <p className="text-slate-500 font-bold text-sm">© 2026 FoodBridge AI. Developed by Antigravity.</p>
      </footer>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}} />
    </div>
  );
}

const FeatureCard = ({ icon, title, description, colorClass, glowClass }: { icon: React.ReactNode; title: string; description: string; colorClass: string; glowClass: string }) => (
  <Card className="feature-card glass-card rounded-[2.5rem] p-10 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
    <CardContent className="p-0 space-y-8 relative z-10">
      <div className={`w-16 h-16 rounded-2xl bg-white shadow-xl ${glowClass} flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500`}>
        {icon}
      </div>
      <div className="space-y-4">
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h3>
        <p className="text-slate-600 font-medium leading-relaxed">{description}</p>
      </div>
      <div className="pt-4 border-t border-slate-100 flex items-center text-sm font-black text-slate-400 group-hover:text-slate-900 transition-colors cursor-pointer">
        Explore Capabilities <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
      </div>
    </CardContent>
  </Card>
);
