"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getToken } from "@/lib/auth";
import {
    Menu,
    X,
    LayoutDashboard,
    Zap,
    LogOut,
    Activity,
    Compass
} from "lucide-react";

export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [user, setUser] = useState<{ role: string } | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener("scroll", handleScroll);

        const token = getToken();
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser(payload);
            } catch (e) {
                console.error("Failed to parse token");
            }
        }

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
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
                    <Link href="/" className="flex items-center space-x-2.5 group">
                        <div className="bg-primary p-2 rounded-lg shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform duration-500">
                            <Zap className="w-5 h-5 text-white fill-white/20" />
                        </div>
                        <span className="font-black text-xl tracking-tighter text-slate-900 uppercase">
                            FoodBridge <span className="text-primary italic">AI</span>
                        </span>
                    </Link>

                    {/* Desktop Main Nav */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <NavLink href="/" active={pathname === "/"}>Home</NavLink>
                        <NavLink href="/#technology">Intelligence</NavLink>
                        <NavLink href="/#network">Network</NavLink>
                        <NavLink href="/#impact">Impact</NavLink>
                    </nav>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-4">
                    {user ? (
                        <div className="flex items-center space-x-3">
                            <Link href={dashboardLink}>
                                <Button className="h-10 px-5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-[0.98]">
                                    <LayoutDashboard className="w-3.5 h-3.5 mr-2" />
                                    <span>{dashboardLabel}</span>
                                </Button>
                            </Link>
                            <Button
                                onClick={handleLogout}
                                variant="ghost"
                                className="h-10 w-10 rounded-lg p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                            >
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center space-x-2">
                            <Link href="/login">
                                <Button variant="ghost" className="h-10 px-5 font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-colors">
                                    Auth Access
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button className="h-10 px-6 rounded-lg bg-primary text-white shadow-lg shadow-primary/20 font-black text-[10px] uppercase tracking-widest hover:translate-y-[-1px] active:translate-y-0 transition-all">
                                    Join Network
                                </Button>
                            </Link>
                        </div>
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

            {/* Mobile Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-2xl p-6 flex flex-col space-y-4 animate-in slide-in-from-top-2 duration-300 md:hidden">
                    <Link href="/" onClick={() => setIsOpen(false)} className="font-black text-xs uppercase tracking-widest text-slate-900 py-2">Home</Link>
                    <Link href="/#technology" onClick={() => setIsOpen(false)} className="font-black text-xs uppercase tracking-widest text-slate-900 py-2">Technology</Link>
                    <Link href="/#impact" onClick={() => setIsOpen(false)} className="font-black text-xs uppercase tracking-widest text-slate-900 py-2">Impact</Link>
                    <hr className="border-slate-100" />
                    {user ? (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Link href={dashboardLink} onClick={() => setIsOpen(false)}>
                                <Button className="w-full h-12 bg-primary text-white font-black text-[10px] uppercase tracking-widest">Dashboard</Button>
                            </Link>
                            <Button
                                onClick={handleLogout}
                                variant="ghost"
                                className="w-full h-12 text-rose-500 font-black text-[10px] uppercase tracking-widest border border-rose-100 bg-rose-50"
                            >
                                Logout Access
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Link href="/login" onClick={() => setIsOpen(false)}>
                                <Button variant="outline" className="w-full h-12 font-black text-[10px] uppercase tracking-widest border-slate-200">Sign In</Button>
                            </Link>
                            <Link href="/register" onClick={() => setIsOpen(false)}>
                                <Button className="w-full h-12 bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">Join</Button>
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
};

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
