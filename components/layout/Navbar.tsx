"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Menu,
    X,
    LayoutDashboard,
    LogOut,
    Home,
    Cpu,
    Network,
    HandHeart,
    MapPin,
    User,
    ChevronDown
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export const Navbar = () => {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState("home");
    const [user, setUser] = useState<{ role: string; name?: string } | null>(null);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        const handleHomeTracking = () => {
            if (pathname === "/" && window.scrollY < 100) {
                setActiveSection("home");
            }
        };

        window.addEventListener("scroll", handleScroll);
        window.addEventListener("scroll", handleHomeTracking);

        let observer: IntersectionObserver | null = null;

        if (pathname === "/") {
            const observerOptions = {
                root: null,
                rootMargin: '-20% 0px -70% 0px',
                threshold: 0
            };

            const observerCallback = (entries: IntersectionObserverEntry[]) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id || "home");
                    }
                });
            };

            observer = new IntersectionObserver(observerCallback, observerOptions);

            const sections = ['technology', 'network', 'impact'];
            sections.forEach(id => {
                const el = document.getElementById(id);
                if (el) observer?.observe(el);
            });

            // Initial check
            handleHomeTracking();
        }

        const token = localStorage.getItem('token');
        if (token) {
            if (token.startsWith('social-')) {
                // For Google Auth users, rely on NextAuth session or localStorage role
                if (session?.user) {
                    setUser({
                        role: (session.user as { role: string }).role || localStorage.getItem('role') || "donor",
                        name: session.user.name || ""
                    });
                } else if (localStorage.getItem('role')) {
                    setUser({ role: localStorage.getItem('role') as string });
                } else {
                    setUser(null);
                }
            } else {
                try {
                    // For standard credential users, parse the JWT
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    setUser(payload);
                } catch (e) {
                    console.error("Failed to parse token");
                    setUser(null);
                }
            }
        } else if (session?.user) {
            setUser({
                role: (session.user as { role: string }).role || "donor",
                name: session.user.name || ""
            });
        } else {
            setUser(null);
        }

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("scroll", handleHomeTracking);
            if (observer) observer.disconnect();
        };
    }, [pathname, session]);

    const handleLogout = async () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            if (session) {
                await signOut({ redirect: false });
            }
            window.location.href = "/login";
        }
    };

    const dashboardLink = user ? `/dashboard/${user.role}` : "/login";
    const dashboardLabel = user?.role === "admin" ? "Admin Console" : "Dashboard";

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
                isScrolled ? "bg-white/80 backdrop-blur-md border-slate-200 py-3 shadow-sm" : "bg-transparent border-transparent py-5"
            )}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Brand */}
                <div className="flex items-center space-x-10">
                    <Link href="/" className="flex items-center space-x-3 group">
                        <div className="relative w-12 h-12 group-hover:scale-110 transition-transform duration-500">
                            <Image
                                src="/logo.png"
                                alt="FoodBridge AI Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <span className="font-black text-xl tracking-tighter text-slate-900 dark:text-white uppercase leading-none">
                            FoodBridge <span className="text-primary italic">AI</span>
                        </span>
                    </Link>

                    {/* Desktop Main Nav */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <NavLink href="/" active={pathname === "/" && activeSection === "home"}>Home</NavLink>
                        <NavLink href="/#technology" active={pathname === "/" && activeSection === "technology"}>Intelligence</NavLink>
                        <NavLink href="/#network" active={pathname === "/" && activeSection === "network"}>Network</NavLink>
                        <NavLink href="/#impact" active={pathname === "/" && activeSection === "impact"}>Impact</NavLink>
                        <NavLink href="/report-hunger" active={pathname === "/report-hunger"}>Report Hunger</NavLink>
                    </nav>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-4">
                    <div className="hidden sm:flex">
                        <ThemeToggle />
                    </div>

                    {/* Only render auth buttons after client mount to prevent Hydration Mismatch */}
                    {mounted ? (
                        user ? (
                            <div className="flex items-center space-x-3">
                                <Link href={dashboardLink}>
                                    <Button className="h-10 px-5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                                        <LayoutDashboard className="w-3.5 h-3.5 mr-2" />
                                        <span>{dashboardLabel}</span>
                                    </Button>
                                </Link>
                                <Button
                                    onClick={handleLogout}
                                    variant="ghost"
                                    className="h-10 w-10 rounded-lg p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100 dark:hover:bg-rose-950 dark:hover:border-rose-900"
                                >
                                    <LogOut className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center space-x-2">
                                <Link href="/login">
                                    <Button variant="ghost" className="h-10 px-5 font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-colors">
                                        Login
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button className="h-11 px-8 rounded-xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 transition-all border border-primary">
                                        Register
                                    </Button>
                                </Link>
                            </div>
                        )
                    ) : (
                        /* Skeleton loader to hold layout space during SSR hydration */
                        <div className="hidden md:flex items-center space-x-2 w-[200px] h-10 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                    )}

                    {/* Mobile Toggle */}
                    <button
                        className="md:hidden p-2 rounded-lg bg-slate-100 text-slate-900 hover:bg-slate-200 transition-colors"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu - Enhanced Backdrop Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Mobile Menu - Side Drawer Style (Better UX) */}
            <div className={cn(
                "fixed top-0 right-0 bottom-0 w-[280px] bg-white dark:bg-slate-950 z-50 shadow-2xl transition-transform duration-300 ease-in-out md:hidden flex flex-col",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-black text-xs uppercase tracking-widest text-slate-400">Navigation</span>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-2">
                    <MobileNavLink href="/" icon={<Home className="w-4 h-4" />} onClick={() => setIsOpen(false)}>Home</MobileNavLink>
                    <MobileNavLink href="/#technology" icon={<Cpu className="w-4 h-4" />} onClick={() => setIsOpen(false)}>Intelligence</MobileNavLink>
                    <MobileNavLink href="/#network" icon={<Network className="w-4 h-4" />} onClick={() => setIsOpen(false)}>Network</MobileNavLink>
                    <MobileNavLink href="/#impact" icon={<HandHeart className="w-4 h-4" />} onClick={() => setIsOpen(false)}>Impact</MobileNavLink>
                    <MobileNavLink href="/report-hunger" icon={<MapPin className="w-4 h-4" />} onClick={() => setIsOpen(false)} variant="accent">Report Hunger</MobileNavLink>
                    
                    <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Theme</span>
                            <ThemeToggle />
                        </div>

                        {mounted && (
                            user ? (
                                <div className="space-y-3">
                                    <Link href={dashboardLink} onClick={() => setIsOpen(false)} className="block">
                                        <Button className="w-full h-12 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20">
                                            <LayoutDashboard className="w-4 h-4 mr-2" />
                                            {dashboardLabel}
                                        </Button>
                                                                    </Link>
                                    <Button
                                        onClick={handleLogout}
                                        variant="ghost"
                                        className="w-full h-12 text-rose-500 font-black text-xs uppercase tracking-widest rounded-xl border border-rose-100 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-900/10 hover:bg-rose-100 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Log Out
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <Link href="/login" onClick={() => setIsOpen(false)} className="block">
                                        <Button variant="outline" className="w-full h-12 border-slate-200 dark:border-slate-800 font-black text-xs uppercase tracking-widest rounded-xl">Sign In</Button>
                                    </Link>
                                    <Link href="/register" onClick={() => setIsOpen(false)} className="block">
                                        <Button className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg">New Account</Button>
                                    </Link>
                                </div>
                            )
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">FoodBridge AI v2.0</p>
                </div>
            </div>
        </header>
    );
};

const MobileNavLink = ({ href, children, icon, onClick, variant }: { href: string; children: React.ReactNode; icon: React.ReactNode; onClick: () => void; variant?: "accent" }) => (
    <Link 
        href={href} 
        onClick={onClick}
        className={cn(
            "flex items-center space-x-3 p-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98]",
            variant === "accent" 
                ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
        )}
    >
        <span className="opacity-70">{icon}</span>
        <span>{children}</span>
    </Link>
);

const NavLink = ({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) => (
    <Link
        href={href}
        className={cn(
            "text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:text-primary relative py-1",
            active ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary" : "text-slate-400"
        )}
    >
        {children}
    </Link>
);
