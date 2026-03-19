"use client";

/**
 * LiveTrackingMap — Donor-side real-time NGO tracking
 * Uses Socket.IO for instant updates + Google Maps Directions API 
 * for live route directions and smooth marker tracing.
 */

import { useEffect, useState, useRef, useCallback, memo, useMemo } from "react";
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { io, Socket } from "socket.io-client";
import { Loader2, Truck, WifiOff, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

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

// ── Props & Config ────────────────────────────────────────────────────────────

interface LiveTrackingMapProps {
    donationId: string;
    pickupLat: number;
    pickupLon: number;
    currentStatus?: string;
}

const mapContainerStyle = {
    width: "100%",
    height: "100%",
};

export default memo(function LiveTrackingMap({
    donationId,
    pickupLat,
    pickupLon,
    currentStatus,
}: LiveTrackingMapProps) {
    const { data: session } = useSession();

    // Feature 4: Map Initialization
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    });

    const [ngoPos, setNgoPos] = useState<{ lat: number, lng: number } | null>(null);
    const [interpolatedPos, setInterpolatedPos] = useState<{ lat: number, lng: number } | null>(null);
    const pickupPos = useMemo(() => ({ lat: pickupLat, lng: pickupLon }), [pickupLat, pickupLon]);
    const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);

    const [ngoName, setNgoName] = useState<string>("NGO Partner");
    const [connected, setConnected] = useState(false);
    const [ngoOnline, setNgoOnline] = useState(false);
    const [lastUpdateSec, setLastUpdateSec] = useState<number | null>(null);
    const [liveStatus, setLiveStatus] = useState(currentStatus || "accepted");
    const [connectionLost, setConnectionLost] = useState(false);

    // Use refs to avoid closure stale state
    const socketRef = useRef<Socket | null>(null);
    const lastUpdateRef = useRef<number>(0);
    const connectionLostTimerRef = useRef<NodeJS.Timeout | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const lastRouteCalcTime = useRef<number>(0);
    const ngoPosRef = useRef<{ lat: number, lng: number } | null>(null);
    const prevPosRef = useRef<{ lat: number, lng: number } | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const INTERPOLATION_DURATION = 2500; // Matches NGO heartbeat

    // ── Tick "X seconds ago" display ──────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            if (lastUpdateRef.current > 0) {
                setLastUpdateSec(Math.round((Date.now() - lastUpdateRef.current) / 1000));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // ── Route Calculation (Feature 5 & 6) ──────────────────────────────────
    const calculateRoute = useCallback(async (origin: { lat: number, lng: number }, dest: { lat: number, lng: number }) => {
        if (!isLoaded || !origin || !dest) return;

        // Anti-spam: Only query Google Maps Directions API once every 5 seconds maximum.
        // This ensures the route path updates gracefully as the NGO location marker bounces/moves without exploding quotas.
        const now = Date.now();
        if (now - lastRouteCalcTime.current < 3000) return;

        try {
            const directionsService = new google.maps.DirectionsService();
            const results = await directionsService.route({
                origin,
                destination: dest,
                travelMode: google.maps.TravelMode.DRIVING,
            });
            setDirectionsResponse(results);
            lastRouteCalcTime.current = now;
        } catch (error) {
            console.error("Directions query failed", error);
        }
    }, [isLoaded]);

    useEffect(() => {
        if (ngoPos) {
            calculateRoute(ngoPos, pickupPos);
        }
    }, [ngoPos, calculateRoute, pickupPos]);

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
                userId: (session?.user as { id: string })?.id || "anonymous",
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

        // ── Receive NGO Location (Feature 1, 2, 3) ─────────────────────────────────────────
        socket.on("receive-location", ({ lat, lng, ngoName: name, timestamp }) => {
            const newPos = { lat, lng };

            // Start smooth interpolation
            if (!ngoPosRef.current) {
                // Initial position - no animation
                setNgoPos(newPos);
                ngoPosRef.current = newPos;
                setInterpolatedPos(newPos);
                prevPosRef.current = newPos;
            } else {
                setNgoPos(newPos);

                // Animate from current interpolated position to new target
                const startPos = prevPosRef.current || ngoPosRef.current;
                ngoPosRef.current = newPos;
                const startTime = Date.now();

                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / INTERPOLATION_DURATION, 1);

                    // Linear interpolation (Ease function could be added for more "Uber" feel)
                    const currentLat = startPos.lat + (newPos.lat - startPos.lat) * progress;
                    const currentLng = startPos.lng + (newPos.lng - startPos.lng) * progress;

                    const currentPos = { lat: currentLat, lng: currentLng };
                    setInterpolatedPos(currentPos);
                    prevPosRef.current = currentPos;

                    if (progress < 1) {
                        animationFrameRef.current = requestAnimationFrame(animate);
                    }
                };

                animationFrameRef.current = requestAnimationFrame(animate);
            }

            setNgoOnline(true);
            setConnectionLost(false);
            if (name) setNgoName(name);

            lastUpdateRef.current = timestamp || Date.now();
            setLastUpdateSec(0);

            if (connectionLostTimerRef.current) clearTimeout(connectionLostTimerRef.current);
            connectionLostTimerRef.current = setTimeout(() => {
                setNgoOnline(false);
                setConnectionLost(true);
            }, 30000);
        });

        socket.on("status-changed", ({ status }) => {
            setLiveStatus(status);
        });

        socket.on("tracking-stopped", () => {
            setNgoOnline(false);
            setConnectionLost(true);
        });

        socket.on("peer-disconnected", () => {
            setNgoOnline(false);
            setConnectionLost(true);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            if (connectionLostTimerRef.current) clearTimeout(connectionLostTimerRef.current);
        };
    }, [donationId, session]);

    // ── Hybrid Tracking Fallback (REST Polling) ──────────────────────
    useEffect(() => {
        const pollLocation = async () => {
            if (ngoOnline && connected) return;

            try {
                const res = await fetch(`/api/donations/live-location?donationId=${donationId}`);
                if (!res.ok) return;
                const data = await res.json();
                if (data.success && data.data?.isLive) {
                    const { liveLatitude: lat, liveLongitude: lng, ngoName: name } = data.data;
                    setNgoPos({ lat, lng });
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

        pollLocation();
        const pollInterval = setInterval(pollLocation, 10000);

        return () => clearInterval(pollInterval);
    }, [donationId, ngoOnline, connected, ngoPos]);

    const statusInfo = STATUS_LABELS[liveStatus] || { label: "Tracking active", color: "text-indigo-600" };

    if (loadError) return <div className="p-4 text-rose-500 font-bold">Error loading Google Maps API</div>;

    const mapCenter = ngoPos || pickupPos;

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

            {/* ── Google Map ───────────────────────────────────────────────── */}
            <div className="h-[420px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-lg relative z-0">
                {!isLoaded && (
                    <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-10 w-full h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        <span className="ml-2 font-bold text-slate-400 text-sm">Loading Live Map...</span>
                    </div>
                )}

                {isLoaded && (
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        zoom={14}
                        center={mapCenter}
                        options={{
                            disableDefaultUI: true,
                            zoomControl: true,
                            mapTypeControl: false,
                            streetViewControl: false,
                            fullscreenControl: false,
                            styles: [
                                {
                                    featureType: "poi",
                                    elementType: "labels",
                                    stylers: [{ visibility: "off" }]
                                }
                            ]
                        }}
                        onLoad={map => { mapRef.current = map; }}
                        onUnmount={() => { mapRef.current = null; }}
                    >
                        {/* Validating Routes and Polylines (Feature 5) */}
                        {directionsResponse && (
                            <DirectionsRenderer
                                directions={directionsResponse}
                                options={{
                                    suppressMarkers: true,
                                    polylineOptions: {
                                        strokeColor: '#6366f1',
                                        strokeWeight: 5,
                                        strokeOpacity: 0.8
                                    }
                                }}
                            />
                        )}

                        {/* Feature 4: Initializing Points - Donor Location Marker */}
                        <Marker
                            position={pickupPos}
                            icon={typeof google !== 'undefined' ? {
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 10,
                                fillColor: '#10b981',
                                fillOpacity: 1,
                                strokeWeight: 3,
                                strokeColor: '#ffffff'
                            } : undefined}
                            title="Your Pickup Location"
                        />

                        {/* Feature 3: NGO Live Tracking Moving Marker */}
                        {interpolatedPos && (
                            <Marker
                                position={interpolatedPos}
                                icon={{
                                    url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                                }}
                                title={ngoName}
                            />
                        )}
                    </GoogleMap>
                )}
            </div>

            {/* ── Info footer ───────────────────────────────────────── */}
            <div className="flex items-center justify-between px-2 text-[10px] font-bold text-slate-400 mt-2">
                <div className="flex items-center space-x-1">
                    <Wifi className="w-3 h-3" />
                    <span>{connected ? "WebSocket Connected" : "Connecting..."}</span>
                </div>
                <span>Google Maps Directions API Navigation</span>
            </div>
        </div>
    );
});
