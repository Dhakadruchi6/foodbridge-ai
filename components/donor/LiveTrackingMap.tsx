"use client";

/**
 * LiveTrackingMap — Donor-side real-time NGO tracking
 * Uses Socket.IO for instant updates + lerp interpolation for smooth marker movement.
 * Feels like Uber / Swiggy.
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { io, Socket } from "socket.io-client";
import { Navigation, Loader2, Truck, WifiOff, Wifi, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

// ── Icons ─────────────────────────────────────────────────────────────────────

const pickupIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const createNgoIcon = (isOnline: boolean) => L.divIcon({
    html: `
    <div style="
      width:52px;height:52px;
      background:${isOnline ? '#4f46e5' : '#64748b'};
      border-radius:50%;
      border:4px solid white;
      box-shadow:0 8px 24px rgba(79,70,229,0.4);
      display:flex;align-items:center;justify-content:center;
      transition:all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      transform-origin: center bottom;
    " class="${isOnline ? 'animate-bounce-subtle' : ''}">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="18.5" cy="17.5" r="2.5"/><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
      </svg>
    </div>`,
    className: "",
    iconSize: [52, 52],
    iconAnchor: [26, 52],
});

// ── Smooth Marker Component (lerp animation) ──────────────────────────────────

function AnimatedNgoMarker({ position, isOnline }: { position: [number, number]; isOnline: boolean }) {
    const markerRef = useRef<L.Marker | null>(null);
    const animRef = useRef<number | null>(null);
    const currentPos = useRef<[number, number]>(position);
    const ngoIcon = createNgoIcon(isOnline);

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    useEffect(() => {
        const [targetLat, targetLng] = position;
        const [startLat, startLng] = currentPos.current;

        // Skip animation if position hasn't changed meaningfully
        if (Math.abs(targetLat - startLat) < 0.000001 && Math.abs(targetLng - startLng) < 0.000001) return;

        const duration = 2000; // 2 seconds smooth transition
        const start = performance.now();

        const animate = (now: number) => {
            const elapsed = now - start;
            const t = Math.min(elapsed / duration, 1); // clamp 0–1
            // easeInOutQuad for natural feel
            const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

            const lat = lerp(startLat, targetLat, eased);
            const lng = lerp(startLng, targetLng, eased);

            if (markerRef.current) {
                markerRef.current.setLatLng([lat, lng]);
            }

            if (t < 1) {
                animRef.current = requestAnimationFrame(animate);
            } else {
                currentPos.current = [targetLat, targetLng];
            }
        };

        if (animRef.current) cancelAnimationFrame(animRef.current);
        animRef.current = requestAnimationFrame(animate);

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [position]);

    return (
        <Marker
            ref={markerRef as any}
            position={currentPos.current}
            icon={ngoIcon}
        >
            <Popup><span className="font-bold text-sm">NGO Partner — Live</span></Popup>
        </Marker>
    );
}

// ── Map auto-follow ───────────────────────────────────────────────────────────

function MapFollower({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.panTo(center, { animate: true, duration: 1 });
    }, [center, map]);
    return null;
}

// ── Status labels ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    accepted: { label: "NGO accepted your request", color: "text-indigo-600" },
    ON_THE_WAY: { label: "NGO is on the way", color: "text-blue-600" },
    NEARBY: { label: "NGO is nearby — almost here!", color: "text-amber-600" },
    ARRIVED: { label: "NGO has arrived!", color: "text-emerald-600" },
    pickup_in_progress: { label: "Pickup in progress", color: "text-indigo-600" },
    delivered: { label: "Food delivered successfully", color: "text-emerald-600" },
    completed: { label: "Mission completed!", color: "text-emerald-700" },
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface LiveTrackingMapProps {
    donationId: string;
    pickupLat: number;
    pickupLon: number;
    currentStatus?: string;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LiveTrackingMap({
    donationId,
    pickupLat,
    pickupLon,
    currentStatus,
}: LiveTrackingMapProps) {
    const { data: session } = useSession();
    const [ngoPos, setNgoPos] = useState<[number, number] | null>(null);
    const [ngoName, setNgoName] = useState<string>("NGO Partner");
    const [connected, setConnected] = useState(false);
    const [ngoOnline, setNgoOnline] = useState(false);
    const [lastUpdateSec, setLastUpdateSec] = useState<number | null>(null);
    const [liveStatus, setLiveStatus] = useState(currentStatus || "accepted");
    const [connectionLost, setConnectionLost] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const lastUpdateRef = useRef<number>(0);
    const connectionLostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Tick "X seconds ago" display ──────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            if (lastUpdateRef.current > 0) {
                setLastUpdateSec(Math.round((Date.now() - lastUpdateRef.current) / 1000));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // ── Socket.IO connection ──────────────────────────────────────────────
    useEffect(() => {
        if (!donationId) return;

        const socket = io(window.location.origin, {
            transports: ["websocket", "polling"],
            reconnectionAttempts: 10,
            reconnectionDelay: 1500,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setConnected(true);
            setConnectionLost(false);
            socket.emit("join-room", {
                donationId,
                role: "donor",
                userId: (session?.user as any)?.id || "anonymous",
            });
        });

        socket.on("disconnect", () => {
            setConnected(false);
        });

        socket.on("reconnect", () => {
            setConnected(true);
            setConnectionLost(false);
            socket.emit("join-room", { donationId, role: "donor" });
        });

        // ── Receive NGO location ─────────────────────────────────────────
        socket.on("receive-location", ({ lat, lng, ngoName: name, timestamp }) => {
            setNgoPos([lat, lng]);
            setNgoOnline(true);
            setConnectionLost(false);
            if (name) setNgoName(name);

            lastUpdateRef.current = timestamp || Date.now();
            setLastUpdateSec(0);

            // Reset connection-lost timer
            if (connectionLostTimerRef.current) clearTimeout(connectionLostTimerRef.current);
            connectionLostTimerRef.current = setTimeout(() => {
                setNgoOnline(false);
                setConnectionLost(true);
            }, 30000); // 30s without update → show "connection lost"
        });

        // ── Receive status update ────────────────────────────────────────
        socket.on("status-changed", ({ status }) => {
            setLiveStatus(status);
        });

        // ── NGO stopped sharing ──────────────────────────────────────────
        socket.on("tracking-stopped", () => {
            setNgoOnline(false);
            setConnectionLost(true);
        });

        socket.on("peer-disconnected", () => {
            setNgoOnline(false);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            if (connectionLostTimerRef.current) clearTimeout(connectionLostTimerRef.current);
        };
    }, [donationId, session]);

    // ── Hybrid Tracking Fallback (REST Polling) ──────────────────────
    // If WebSockets are blocked (e.g. on Vercel), this ensures tracking still works.
    useEffect(() => {
        const pollLocation = async () => {
            if (ngoOnline && connected) return; // WS is healthy and receiving data

            try {
                const res = await fetch(`/api/donations/live-location?donationId=${donationId}`);
                const data = await res.json();
                if (data.success && data.data?.isLive) {
                    const { liveLatitude: lat, liveLongitude: lng, ngoName: name } = data.data;
                    setNgoPos([lat, lng]);
                    setNgoOnline(true);
                    setConnectionLost(false);
                    if (name) setNgoName(name);

                    lastUpdateRef.current = new Date(data.data.liveLocationUpdatedAt).getTime();
                    setLastUpdateSec(data.data.ageSeconds || 0);
                }
            } catch (err) {
                console.warn("[Tracking-Fallback] DB Poll failed:", err);
            }
        };

        // Poll immediately on mount, then every 10s if WS is not active
        pollLocation();
        const pollInterval = setInterval(pollLocation, 10000);

        return () => clearInterval(pollInterval);
    }, [donationId, ngoOnline, connected]);

    const statusInfo = STATUS_LABELS[liveStatus] || { label: "Tracking active", color: "text-indigo-600" };

    return (
        <div className="space-y-3">
            {/* ── Status header ─────────────────────────────────────── */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center border border-indigo-200">
                        <Truck className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-900 leading-none">{ngoName}</h4>
                        <p className={cn("text-[10px] font-bold mt-1 uppercase tracking-widest", statusInfo.color)}>
                            {statusInfo.label}
                        </p>
                    </div>
                </div>

                {/* Connection indicator */}
                <div className={cn(
                    "px-3 py-1.5 rounded-full border flex items-center space-x-2",
                    connectionLost
                        ? "bg-red-50 border-red-100"
                        : ngoOnline
                            ? "bg-emerald-50 border-emerald-100"
                            : "bg-slate-50 border-slate-100"
                )}>
                    {connectionLost ? (
                        <>
                            <WifiOff className="w-3 h-3 text-red-500" />
                            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Connection Lost</span>
                        </>
                    ) : ngoOnline ? (
                        <>
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                                {lastUpdateSec !== null ? `${lastUpdateSec}s ago` : "LIVE"}
                            </span>
                        </>
                    ) : (
                        <>
                            <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Waiting...</span>
                        </>
                    )}
                </div>
            </div>

            {/* ── Connection Lost Banner ─────────────────────────────── */}
            {connectionLost && !ngoOnline && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-3">
                    <WifiOff className="w-4 h-4 text-red-500 shrink-0" />
                    <div>
                        <p className="text-xs font-black text-red-700">NGO location signal lost</p>
                        <p className="text-[10px] text-red-500">Showing last known position. Waiting to reconnect...</p>
                    </div>
                </div>
            )}

            {/* ── Map ───────────────────────────────────────────────── */}
            <div className="h-[420px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-lg relative z-0">
                <MapContainer
                    center={ngoPos || [pickupLat, pickupLon]}
                    zoom={14}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl={true}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />

                    {/* Pickup marker */}
                    <Marker position={[pickupLat, pickupLon]} icon={pickupIcon}>
                        <Popup>
                            <div className="text-center">
                                <MapPin className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                                <span className="font-bold text-sm">Your Pickup Location</span>
                            </div>
                        </Popup>
                    </Marker>

                    {/* Animated NGO marker */}
                    {ngoPos && (
                        <>
                            {/* Zomato-style Delivery Path */}
                            <Polyline
                                positions={[ngoPos, [pickupLat, pickupLon]]}
                                pathOptions={{
                                    color: '#6366f1',
                                    weight: 4,
                                    dashArray: '10, 15',
                                    lineCap: 'round',
                                    lineJoin: 'round',
                                    opacity: 0.6
                                }}
                            />
                            <AnimatedNgoMarker position={ngoPos} isOnline={ngoOnline} />
                            <MapFollower center={ngoPos} />
                        </>
                    )}
                </MapContainer>

            </div>

            {/* ── Info footer ───────────────────────────────────────── */}
            <div className="flex items-center justify-between px-2 text-[10px] font-bold text-slate-400">
                <div className="flex items-center space-x-1">
                    <Wifi className="w-3 h-3" />
                    <span>{connected ? "WebSocket Connected" : "Connecting..."}</span>
                </div>
                <span>Real-time tracking powered by FoodBridge AI</span>
            </div>
        </div>
    );
}
