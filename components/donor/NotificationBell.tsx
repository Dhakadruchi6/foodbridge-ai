"use client";

import { useEffect, useState, useRef } from "react";
import { getRequest, patchRequest } from "@/lib/apiClient";
import { Bell, CheckCheck, Clock, Package, Truck, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Notification {
    _id: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
    donationId?: string;
}

const typeIcon: Record<string, React.ReactNode> = {
    donation_accepted: <CheckCircle2 className="w-4 h-4 text-indigo-500" />,
    pickup_started: <Truck className="w-4 h-4 text-amber-500" />,
    collected: <Package className="w-4 h-4 text-blue-500" />,
    delivered: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    new_donation: <Truck className="w-4 h-4 text-emerald-500" />,
    system: <Bell className="w-4 h-4 text-slate-400" />,
};

export const NotificationBell = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const result = await getRequest("/api/notifications");
            if (result.success) {
                setNotifications(result.data.notifications);
                setUnreadCount(result.data.unreadCount);
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    const markAllRead = async () => {
        await patchRequest("/api/notifications", {});
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const handleNotificationClick = async (n: Notification) => {
        setOpen(false);
        if (n.type === 'new_donation') {
            router.push('/dashboard/ngo');
        } else {
            router.push('/dashboard/donor');
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
                className="relative w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
            >
                <Bell className="w-4 h-4 text-slate-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-black text-slate-900">Notifications</h4>
                            {unreadCount > 0 && (
                                <p className="text-[10px] font-bold text-slate-400">{unreadCount} unread</p>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="text-[10px] font-black text-primary hover:text-primary/80 uppercase tracking-wide flex items-center space-x-1">
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    <span>Mark all read</span>
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-slate-400 text-xs font-bold">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n._id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={cn(
                                        "p-4 flex items-start space-x-3 hover:bg-slate-50 transition-colors cursor-pointer",
                                        !n.read && "bg-indigo-50/50"
                                    )}
                                >
                                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                                        {typeIcon[n.type] || typeIcon.system}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-xs leading-relaxed",
                                            n.read ? "text-slate-500 font-medium" : "text-slate-800 font-bold"
                                        )}>
                                            {n.message}
                                        </p>
                                        <div className="flex items-center mt-1 space-x-1 text-[10px] font-bold text-slate-400">
                                            <Clock className="w-3 h-3" />
                                            <span>{timeAgo(n.createdAt)}</span>
                                        </div>
                                    </div>
                                    {!n.read && (
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
