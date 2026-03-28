"use client";

/**
 * LiveTrackingMap — Donor-side real-time NGO tracking
 * Uses Socket.IO for instant updates + Google Maps Directions API 
 * for live route directions and smooth marker tracing.
 */

import { useEffect, useState, useRef, useCallback, memo, useMemo } from "react";
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, OverlayView } from "@react-google-maps/api";
import { io, Socket } from "socket.io-client";
import { Loader2, Target, Crosshair, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { getRequest } from "@/lib/apiClient";

// ── Status labels ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    ACCEPTED: { label: "NGO accepted your request", color: "text-indigo-600" },
    ON_THE_WAY: { label: "NGO is on the way", color: "text-blue-600" },
    NEARBY: { label: "NGO is nearby — almost here!", color: "text-amber-600" },
    ARRIVED: { label: "NGO has arrived!", color: "text-emerald-600" },
    PICKUP_IN_PROGRESS: { label: "Pickup in progress", color: "text-indigo-600" },
    COLLECTED: { label: "Food Collected", color: "text-indigo-600" },
    DELIVERED: { label: "Food delivered successfully", color: "text-emerald-600" },
    COMPLETED: { label: "Mission completed!", color: "text-emerald-700" },
};

// ── Props & Config ────────────────────────────────────────────────────────────

const MAPS_LIBRARIES: ("places")[] = ["places"];

interface LiveTrackingMapProps {
    donationId: string;
    pickupLat: number;
    pickupLon: number;
    currentStatus?: string;
    ngoName?: string;
    destinationAddress?: string;
    onTrackingUpdate?: (data: { distance: string; duration: string; isNearby: boolean }) => void;
    onStatusChange?: (status: string) => void;
    onReconnect?: () => void;
}

const mapContainerStyle = {
    width: "100%",
    height: "100%",
};

const SILVER_MAP_STYLE = [
    { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
    { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
    { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
    { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
];

export default memo(function LiveTrackingMap({
    donationId,
    pickupLat,
    pickupLon,
    currentStatus,
    ngoName: propNgoName,
    destinationAddress,
    onTrackingUpdate,
    onStatusChange,
    onReconnect,
}: LiveTrackingMapProps) {
    const { data: session } = useSession();

    // Feature 4: Map Initialization
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: MAPS_LIBRARIES,
    });

    const [ngoPos, setNgoPos] = useState<{ lat: number, lng: number } | null>(null);
    const [interpolatedPos, setInterpolatedPos] = useState<{ lat: number, lng: number } | null>(null);
    const [rotation, setRotation] = useState(0);

    const pickupPos = useMemo(() => ({ 
        lat: pickupLat || ngoPos?.lat || 28.6139, // Fallback to NGO or Delhi
        lng: pickupLon || ngoPos?.lng || 77.2090 
    }), [pickupLat, pickupLon, ngoPos]);
    const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);

    const [connected, setConnected] = useState(false);
    const [ngoOnline, setNgoOnline] = useState(false);
    const [liveStatus, setLiveStatus] = useState(currentStatus?.toUpperCase() || "ACCEPTED");
    const [shouldFollow, setShouldFollow] = useState(true); // Track Live toggle

    // Step 6 & 12: Initial Load + Fallback Polling
    useEffect(() => {
        if (!donationId) return;

        const fetchInitialOrPoll = async () => {
             if ((Date.now() - lastUpdateRef.current < 10000)) return;

             console.log("[WS-DEBUG] Fetching location from API...");
             try {
                 const res = await getRequest(`/api/donations/live-location?donationId=${donationId}`);
                 if (res.success && res.data?.isLive) {
                     const { liveLatitude: lat, liveLongitude: lng, ngoName: name } = res.data;
                     if (lat && lng) {
                          const newPos = { lat, lng };
                          setNgoPos(newPos);
                          setNgoOnline(true);

                          if (!ngoPosRef.current) {
                               ngoPosRef.current = newPos;
                               setInterpolatedPos(newPos);
                          }
                          lastUpdateRef.current = new Date(res.data.liveLocationUpdatedAt).getTime();
                     }
                 }
             } catch (e) {
                 console.error("[WS-DEBUG] Initial/Fallback fetch failed:", e);
             }
        };

        fetchInitialOrPoll();
        const interval = setInterval(fetchInitialOrPoll, 10000);
        return () => clearInterval(interval);
    }, [donationId, connected, ngoOnline]);

    const socketRef = useRef<Socket | null>(null);
    const lastUpdateRef = useRef<number>(0);
    const connectionLostTimerRef = useRef<NodeJS.Timeout | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const lastRouteCalcTime = useRef<number>(0);
    const ngoPosRef = useRef<{ lat: number, lng: number } | null>(null);
    const prevPosRef = useRef<{ lat: number, lng: number } | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastRoutePos = useRef<{ lat: number, lng: number } | null>(null);
    const INTERPOLATION_DURATION = 2500; // Premium 2.5s glide

    // ── Helper: Haversine Distance ──
    const getDistance = (p1: { lat: number, lng: number }, p2: { lat: number, lng: number }) => {
        const R = 6371e3; // meters
        const φ1 = p1.lat * Math.PI/180;
        const φ2 = p2.lat * Math.PI/180;
        const Δφ = (p2.lat-p1.lat) * Math.PI/180;
        const Δλ = (p2.lng-p1.lng) * Math.PI/180;
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // meters
    };

    // ── Route Calculation ──
    const calculateRoute = useCallback(async (origin: { lat: number, lng: number }, dest: { lat: number, lng: number }) => {
        if (!isLoaded || !origin || !dest) return;

        const now = Date.now();
        const distMoved = lastRoutePos.current ? getDistance(lastRoutePos.current, origin) : 999;
        
        // Smart Trigger: Distance > 50m OR 10s interval
        if (distMoved < 50 && (now - lastRouteCalcTime.current < 10000)) return;

        try {
            const directionsService = new google.maps.DirectionsService();
            const results = await directionsService.route({
                origin,
                destination: dest,
                travelMode: google.maps.TravelMode.DRIVING,
            });
            setDirectionsResponse(results);
            lastRouteCalcTime.current = now;
            lastRoutePos.current = origin;

            if (results.routes[0]?.legs[0] && onTrackingUpdate) {
                const leg = results.routes[0].legs[0];
                onTrackingUpdate({
                    distance: leg.distance?.text || "...",
                    duration: leg.duration?.text || "...",
                    isNearby: (leg.distance?.value || 0) < 500
                });
            }
        } catch (error) {
            console.error("Directions query failed", error);
        }
    }, [isLoaded, onTrackingUpdate]);

    useEffect(() => {
        if (ngoPos) calculateRoute(ngoPos, pickupPos);
    }, [ngoPos, calculateRoute, pickupPos]);

    const mapCenter = useMemo(() => ngoPos || pickupPos, [ngoPos, pickupPos]);

    // ── Socket.IO connection (Singleton + Recovery) ─────────────────────────
    useEffect(() => {
        if (!donationId) return;

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://foodbridge-ai-nk8s.onrender.com";
        
        // Singleton Implementation
        if (!socketRef.current) {
            console.log("[WS-TRACK] Initializing primary socket link...");
            socketRef.current = io(socketUrl, {
                transports: ["websocket", "polling"],
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 10000 // 10s connection timeout
            });
        }

        const socket = socketRef.current;

        const handleJoin = () => {
            console.log("[WS-TRACK] Joining room:", donationId);
            socket.emit("tracking:join", { donationId });
            setConnected(true);
        };

        socket.on("connect", handleJoin);

        socket.on("disconnect", (reason) => {
            console.warn("[WS-TRACK] Disconnected:", reason);
            setConnected(false);
            if (reason === "io server disconnect") {
                socket.connect(); // Force reconnect if server killed it
            }
        });

        socket.on("reconnect", (attempt) => {
            console.log(`[WS-TRACK] Restored connection (Attempt ${attempt})`);
            handleJoin();
            onReconnect?.();
        });

        socket.on("connect_error", (error) => {
            console.error("[WS-TRACK] Connection Error:", error.message);
            setConnected(false);
        });

        // ── Structured Tracking Listeners ──
        socket.on("tracking:location", (data) => {
            if (data.donationId !== donationId && data.donationId !== undefined) return;
            
            const { lat, lng, timestamp, updated_at } = data;
            const eventTime = updated_at ? new Date(updated_at).getTime() : (timestamp || Date.now());

            if (eventTime < lastUpdateRef.current) return;
            lastUpdateRef.current = eventTime;

            const newPos = { lat, lng };
            setNgoOnline(true);

            if (!ngoPosRef.current) {
                setNgoPos(newPos);
                ngoPosRef.current = newPos;
                setInterpolatedPos(newPos);
                prevPosRef.current = newPos;
            } else {
                if (lng === ngoPosRef.current.lng && lat === ngoPosRef.current.lat) return;

                setNgoPos(newPos);
                const startPos = prevPosRef.current || ngoPosRef.current;
                ngoPosRef.current = newPos;
                const startTime = Date.now();

                if (Math.abs(newPos.lat - startPos.lat) > 0.000001) {
                    const angle = Math.atan2(newPos.lng - startPos.lng, newPos.lat - startPos.lat) * 180 / Math.PI;
                    setRotation(angle);
                }

                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / INTERPOLATION_DURATION, 1);
                    const currentPos = {
                        lat: startPos.lat + (newPos.lat - startPos.lat) * progress,
                        lng: startPos.lng + (newPos.lng - startPos.lng) * progress
                    };
                    setInterpolatedPos(currentPos);
                    prevPosRef.current = currentPos;

                    if (progress < 1) animationFrameRef.current = requestAnimationFrame(animate);
                };
                animationFrameRef.current = requestAnimationFrame(animate);

                if (shouldFollow && mapRef.current && typeof google !== 'undefined') {
                    const bounds = new google.maps.LatLngBounds();
                    bounds.extend(pickupPos);
                    bounds.extend(newPos);
                    mapRef.current.fitBounds(bounds, { top: 80, bottom: 200, left: 40, right: 40 });
                }
            }

            if (connectionLostTimerRef.current) clearTimeout(connectionLostTimerRef.current);
            connectionLostTimerRef.current = setTimeout(() => setNgoOnline(false), 12000);
        });

        socket.on("tracking:status", (data) => {
            if (data.donationId !== donationId && data.donationId !== undefined) return;
            if (data.status === liveStatus) return;

            console.log("[WS-TRACK] Incoming Status:", data.status);
            setLiveStatus(data.status);
            onStatusChange?.(data.status);
            
            if (['ARRIVED', 'DELIVERED', 'COMPLETED'].includes(data.status.toUpperCase())) {
                setNgoOnline(false);
            }
        });

        socket.on("tracking:stopped", () => {
            console.log("[WS-TRACK] Remote stopped tracking session");
            setNgoOnline(false);
        });

        return () => {
            // Partial cleanup: remove listeners but keep socket instance for singleton reuse if needed
            // However, since useEffect will re-run if donationId changes, we might want to reset
            socket.off("connect");
            socket.off("disconnect");
            socket.off("reconnect");
            socket.off("connect_error");
            socket.off("tracking:location");
            socket.off("tracking:status");
            socket.off("tracking:stopped");
            
            if (connectionLostTimerRef.current) clearTimeout(connectionLostTimerRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [donationId, session, pickupPos, shouldFollow, onStatusChange, liveStatus]);






    if (loadError) return <div className="p-4 text-rose-500 font-bold">Error loading Google Maps API</div>;

    return (
        <div className="w-full h-full relative">
            {/* ── Google Map ───────────────────────────────────────────────── */}
            <div className="h-full w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl relative z-0">
                {/* Step 7: Connection Status Banner — Dynamic logic */}
                {!connected ? (
                    <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col items-center space-y-4">
                            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                            <p className="text-xs font-black uppercase tracking-widest text-white/70">Reconnecting...</p>
                        </div>
                    </div>
                ) : null}

                {/* Loading State Overlay */}
                {!isLoaded && (
                    <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-10 w-full h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        <span className="ml-2 font-bold text-slate-400 text-sm">Loading Live Map...</span>
                    </div>
                )}

                {/* Route Info Overlay (Embedded Style) */}
                {isLoaded && interpolatedPos && (propNgoName || destinationAddress) && (
                    <div className="absolute top-4 left-4 right-4 z-20 animate-in fade-in slide-in-from-top-4 duration-1000">
                        <div className="bg-white/95 backdrop-blur-2xl border border-white/40 rounded-2xl p-4 shadow-xl flex items-center space-x-4">
                            <div className="relative flex flex-col items-center">
                                <div className="w-2.5 h-2.5 rounded-full border-2 border-indigo-500 bg-white z-10" />
                                <div className="w-0.5 h-4 border-l-2 border-dashed border-slate-200 my-0.5" />
                                <MapPin className="w-3.5 h-3.5 text-emerald-500 z-10" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="mb-2">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">From</p>
                                    <h4 className="text-[10px] font-black text-slate-800 truncate">{propNgoName || 'NGO Partner'}</h4>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">To</p>
                                    <h4 className="text-[10px] font-black text-slate-800 truncate">{destinationAddress || 'Donation Point'}</h4>
                                </div>
                            </div>
                        </div>
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
                                zoomControl: false,
                                mapTypeControl: false,
                                streetViewControl: false,
                                fullscreenControl: false,
                                styles: SILVER_MAP_STYLE
                            }}
                            onLoad={map => { mapRef.current = map; }}
                            onUnmount={() => { mapRef.current = null; }}
                        >
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

                            {pickupLat && pickupLon && (
                                <Marker
                                    position={pickupPos}
                                    icon={typeof google !== 'undefined' ? {
                                        url: 'https://cdn-icons-png.flaticon.com/512/619/619153.png',
                                        scaledSize: new google.maps.Size(40, 40),
                                        anchor: new google.maps.Point(20, 40),
                                    } : undefined}
                                    title="Your Location"
                                />
                            )}

                            {interpolatedPos && (
                                <OverlayView
                                    position={interpolatedPos}
                                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                                >
                                    <div 
                                        style={{
                                            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                                            transition: 'transform 0.4s ease-out'
                                        }}
                                        className="relative"
                                    >
                                        <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping scale-150" />
                                        <Image 
                                            src="https://cdn-icons-png.flaticon.com/512/3063/3063822.png" 
                                            alt="NGO Scooter"
                                            width={45}
                                            height={45}
                                            className="relative z-10 drop-shadow-lg"
                                            unoptimized
                                        />
                                    </div>
                                </OverlayView>
                            )}
                        </GoogleMap>

                        {/* Floating Recenter & Track Controls */}
                        <div className="absolute right-4 bottom-4 flex flex-col space-y-3 z-10">
                            <button
                                onClick={() => {
                                    if (mapRef.current && (ngoPos || pickupPos)) {
                                        mapRef.current.panTo(ngoPos || pickupPos);
                                        mapRef.current.setZoom(16);
                                    }
                                }}
                                className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center text-slate-600 hover:text-indigo-600 active:scale-90 transition-all"
                            >
                                <Target className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                            <button
                                onClick={() => setShouldFollow(!shouldFollow)}
                                className={cn(
                                    "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl shadow-xl border flex items-center justify-center transition-all active:scale-90",
                                    shouldFollow ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white border-slate-100 text-slate-400"
                                )}
                            >
                                <Crosshair className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
});
