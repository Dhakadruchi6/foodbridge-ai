"use client";

/**
 * LiveTrackingMap — Donor-side real-time NGO tracking
 * Uses Socket.IO for instant updates + Google Maps Directions API 
 * for live route directions and smooth marker tracing.
 */

import { useEffect, useState, useRef, useCallback, memo, useMemo } from "react";
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { io, Socket } from "socket.io-client";
import { Loader2, Truck, WifiOff, Wifi, Target, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { getRequest } from "@/lib/apiClient";

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
    onTrackingUpdate?: (data: { distance: string; duration: string; isNearby: boolean }) => void;
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
    onTrackingUpdate,
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
    const [shouldFollow, setShouldFollow] = useState(true); // Track Live toggle

    // Step 6 & 12: Initial Load + Fallback Polling
    useEffect(() => {
        if (!donationId) return;

        const fetchInitialOrPoll = async () => {
             // If we already have a live socket update, we don't need to force a REST poll unless we stall
             if (ngoOnline && connected && (Date.now() - lastUpdateRef.current < 10000)) return;

             console.log("[WS-DEBUG] Fetching location from API...");
             try {
                 const res = await getRequest(`/api/donations/live-location?donationId=${donationId}`);
                 if (res.success && res.data?.isLive) {
                     const { liveLatitude: lat, liveLongitude: lng, ngoName: name } = res.data;
                     if (lat && lng) {
                          const newPos = { lat, lng };
                          setNgoPos(newPos);
                          setNgoOnline(true);
                          setConnectionLost(false);
                          if (name) setNgoName(name);

                          if (!ngoPosRef.current) {
                              ngoPosRef.current = newPos;
                              setInterpolatedPos(newPos);
                          }
                          lastUpdateRef.current = new Date(res.data.liveLocationUpdatedAt).getTime();
                          setLastUpdateSec(res.data.ageSeconds || 0);
                     }
                 }
             } catch (e) {
                 console.error("[WS-DEBUG] Initial/Fallback fetch failed:", e);
             }
        };

        fetchInitialOrPoll(); // Run immediately on mount or when connected state changes
        const interval = setInterval(fetchInitialOrPoll, 10000);

        return () => clearInterval(interval);
    }, [donationId, connected, ngoOnline]);


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

            // Feature 4: Expose Distance & ETA
            if (results.routes[0]?.legs[0] && onTrackingUpdate) {
                const leg = results.routes[0].legs[0];
                const distValue = leg.distance?.value || 0; // meters
                onTrackingUpdate({
                    distance: leg.distance?.text || "Calculating...",
                    duration: leg.duration?.text || "Calculating...",
                    isNearby: distValue < 500
                });
            }
        } catch (error) {
            console.error("Directions query failed", error);
        }
    }, [isLoaded, onTrackingUpdate]);

    useEffect(() => {
        if (ngoPos) {
            calculateRoute(ngoPos, pickupPos);
        }
    }, [ngoPos, calculateRoute, pickupPos]);

    const mapCenter = useMemo(() => ngoPos || pickupPos, [ngoPos, pickupPos]);

    // ── Socket.IO connection ──────────────────────────────────────────────
    useEffect(() => {
        if (!donationId) return;

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
        const socket = io(socketUrl, {
            transports: ["websocket"], // Step 3: Force websocket for critical stability
            reconnectionAttempts: 10,
            reconnectionDelay: 1500,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("[WS-DEBUG] Donor socket connected:", socket.id);
            setConnected(true);
            setConnectionLost(false);
            // Step 1: Join room using donationId
            socket.emit("join-room", donationId);
        });

        socket.on("disconnect", () => {
            setConnected(false);
        });

        socket.on("reconnect", () => {
            setConnected(true);
            setConnectionLost(false);
            socket.emit("join-room", { donationId, role: "donor" });
        });

        // ── Receive NGO Location (Step 3, 4, 11) ─────────────────────────────────────────
        socket.on("receive-location", (data) => {
            console.log("[WS-DEBUG] NGO location received:", data);
            const { lat, lng, ngoName: name, timestamp } = data;
            const newPos = { lat, lng };

            // Step 4: Render NGO marker only when location is received
            if (!ngoPosRef.current) {
                setNgoPos(newPos);
                ngoPosRef.current = newPos;
                setInterpolatedPos(newPos);
                prevPosRef.current = newPos;
            } else {
                setNgoPos(newPos);

                // Step 5: Smooth Marker Movement (Interpolation)
                const startPos = prevPosRef.current || ngoPosRef.current;
                ngoPosRef.current = newPos;
                const startTime = Date.now();

                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / INTERPOLATION_DURATION, 1);

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

                // Step 10 & 8: Recenter and Auto-Follow if enabled
                if (shouldFollow && mapRef.current) {
                    // Step 10: Auto Zoom Map / Fit Bounds
                    const bounds = new google.maps.LatLngBounds();
                    bounds.extend(pickupPos);
                    bounds.extend(newPos);
                    mapRef.current.fitBounds(bounds, { top: 100, bottom: 250, left: 50, right: 50 });
                }
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
                // Step 12: If no update for 10s (using shorter timer here for active fallback)
            }, 10000); // 10s fallback threshold
        });

        socket.on("status-changed", ({ status }) => {
            setLiveStatus(status);
            // Step 13: When ARRIVED, we can stop active tracking or transition UI
            if (status === 'ARRIVED' || status === 'delivered') {
                console.log("[WS-DEBUG] Mission reached terminal state, stopping tracking.");
                setNgoOnline(false);
            }
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
    }, [donationId, session, pickupPos, shouldFollow]); // Added pickupPos and shouldFollow as they are used in the Receive Location listener



    const statusInfo = STATUS_LABELS[liveStatus] || { label: "Tracking active", color: "text-indigo-600" };

    if (loadError) return <div className="p-4 text-rose-500 font-bold">Error loading Google Maps API</div>;

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
                {/* Step 7: Connection Status Banner — Dynamic logic */}
                {!connected ? (
                    <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col items-center space-y-4">
                            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                            <p className="text-xs font-black uppercase tracking-widest text-white/70">Reconnecting...</p>
                        </div>
                    </div>
                ) : (
                    <div className="absolute top-20 right-4 z-10">
                         <div className="bg-emerald-500/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center space-x-2 border border-emerald-400/50 shadow-lg">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Live tracking active</span>
                         </div>
                    </div>
                )}
                {!isLoaded && (
                    <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-10 w-full h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        <span className="ml-2 font-bold text-slate-400 text-sm">Loading Live Map...</span>
                    </div>
                )}

                {isLoaded && (
                    <>
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            zoom={14}
                            center={mapCenter}
                            options={{
                                disableDefaultUI: true,
                                zoomControl: false, // Custom styled controls look better
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

                            {/* Feature 4: Donor Location Marker — Modern Home Icon */}
                            <Marker
                                position={pickupPos}
                                icon={typeof google !== 'undefined' ? {
                                    url: 'https://cdn-icons-png.flaticon.com/512/619/619153.png',
                                    scaledSize: new google.maps.Size(40, 40),
                                    anchor: new google.maps.Point(20, 40),
                                } : undefined}
                                title="Your Location"
                            />

                            {/* Feature 3: NGO Live Tracking Moving Marker — Vehicle Hub */}
                            {interpolatedPos && (
                                <Marker
                                    position={
                                        // Visual Offset if perfectly overlapping with Home icon
                                        interpolatedPos.lat === pickupPos.lat && interpolatedPos.lng === pickupPos.lng
                                            ? { lat: interpolatedPos.lat + 0.00005, lng: interpolatedPos.lng + 0.00005 }
                                            : interpolatedPos
                                    }
                                    icon={typeof google !== 'undefined' ? {
                                        url: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
                                        scaledSize: new google.maps.Size(45, 45),
                                        anchor: new google.maps.Point(22, 22),
                                    } : undefined}
                                    zIndex={1000} // Ensure it's above the home icon
                                    title={ngoName}
                                />
                            )}
                        </GoogleMap>

                        {/* Floating Recenter & Track Controls */}
                        <div className="absolute right-4 bottom-24 flex flex-col space-y-3 z-10">
                            <button
                                onClick={() => {
                                    if (mapRef.current && (ngoPos || pickupPos)) {
                                        mapRef.current.panTo(ngoPos || pickupPos);
                                        mapRef.current.setZoom(16);
                                    }
                                }}
                                className="w-12 h-12 bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center text-slate-600 hover:text-indigo-600 active:scale-90 transition-all"
                                title="Recenter Map"
                            >
                                <Target className="w-6 h-6" />
                            </button>
                            <button
                                onClick={() => setShouldFollow(!shouldFollow)}
                                className={cn(
                                    "w-12 h-12 rounded-2xl shadow-xl border flex items-center justify-center transition-all active:scale-90",
                                    shouldFollow ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white border-slate-100 text-slate-400"
                                )}
                                title="Auto-Follow Agent"
                            >
                                <Crosshair className="w-6 h-6" />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* ── Info footer ───────────────────────────────────────── */}
            <div className="flex items-center justify-between px-2 text-[10px] font-bold text-slate-400 mt-2">
                <div className="flex items-center space-x-1">
                    <Wifi className="w-3 h-3" />
                    <span>{connected ? "Live tracking active" : "Reconnecting..."}</span>
                </div>
                <span>Google Maps Directions Engine</span>
            </div>
        </div>
    );
});
