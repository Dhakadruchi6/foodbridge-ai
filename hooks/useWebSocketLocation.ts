"use client";

/**
 * useWebSocketLocation — NGO side
 * Streams GPS to the Socket.IO server every 2-3 seconds.
 * Also emits status updates via WebSocket for instant donor sync.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { postRequest } from "@/lib/apiClient";

interface LocationHookOptions {
    donationId: string | null;
    userId: string | null;
    ngoName?: string;
    enabled: boolean;
}

export function useWebSocketLocation({
    donationId,
    userId,
    ngoName = "NGO Partner",
    enabled,
}: LocationHookOptions) {
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const lastEmitRef = useRef<number>(0);
    const lastDbSyncRef = useRef<number>(0);
    const THROTTLE_MS = 1200; // WebSocket: 1.2 seconds (Blinkit speed)
    const DB_SYNC_MS = 10000;   // Database: 10 seconds (less frequent to save bandwidth)
    const MOVEMENT_THRESHOLD = 0.000005; // ~0.5 meters
    const lastPosRef = useRef<{ lat: number, lng: number } | null>(null);

    // ── Connect & join room (Singleton + Resilience) ─────────────────────
    useEffect(() => {
        if (!donationId || !userId || !enabled) return;

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://foodbridge-ai-nk8s.onrender.com";
        
        if (!socketRef.current) {
            console.log("[WS-TRACK] Initializing NGO broadcast link...");
            socketRef.current = io(socketUrl, {
                transports: ["websocket", "polling"],
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 10000
            });
        }

        const socket = socketRef.current;

        const handleJoin = () => {
            console.log("[WS-TRACK] NGO Join Room:", donationId);
            socket.emit("tracking:join", { donationId });
            setIsConnected(true);
        };

        socket.on("connect", handleJoin);

        socket.on("reconnect", (attempt) => {
            console.log(`[WS-TRACK] NGO Restored (Attempt ${attempt})`);
            handleJoin();
        });

        socket.on("disconnect", (reason) => {
            console.warn("[WS-TRACK] NGO Disconnected:", reason);
            setIsConnected(false);
            if (reason === "io server disconnect") socket.connect();
        });

        socket.on("connect_error", (error) => {
            console.error("[WS-TRACK] NGO Link Error:", error.message);
            setIsConnected(false);
        });

        return () => {
            // Partial cleanup to keep singleton active
            socket.off("connect");
            socket.off("reconnect");
            socket.off("disconnect");
            socket.off("connect_error");
        };
    }, [donationId, userId, enabled]);

    // ── Stream GPS location ─────────────────────────────────────────────
    useEffect(() => {
        if (!enabled || !donationId) return;

        if (!navigator.geolocation) {
            console.warn("[NGO-WS] Geolocation not supported");
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const now = Date.now();
                if (now - lastEmitRef.current < THROTTLE_MS) return;
                lastEmitRef.current = now;

                const { latitude: lat, longitude: lng, accuracy } = position.coords;

                // ─── STOPPED DETECTION ───
                if (lastPosRef.current) {
                    const dLat = Math.abs(lat - lastPosRef.current.lat);
                    const dLng = Math.abs(lng - lastPosRef.current.lng);
                    if (dLat < MOVEMENT_THRESHOLD && dLng < MOVEMENT_THRESHOLD) {
                        // Position hasn't changed significantly, we can skip emitting or emit at lower frequency
                        // For now we'll just continue so the "LIVE" indicator stays active, 
                        // but we could optimize here if needed.
                    }
                }
                lastPosRef.current = { lat, lng };

                const socket = socketRef.current;

                if (socket?.connected) {
                    socket.emit("tracking:location", {
                        donationId,
                        lat,
                        lng,
                        updated_at: new Date().toISOString()
                    });
                }

                // ─── DB SYNC FALLBACK ───
                // If WS is slow or blocked, update the DB so the donor's REST fallback works.
                if (now - lastDbSyncRef.current > DB_SYNC_MS) {
                    lastDbSyncRef.current = now;
                    postRequest("/api/donations/live-location", {
                        donationId,
                        latitude: lat,
                        longitude: lng
                    }).catch(err => console.error("[NGO-DB] Sync Error:", err));
                }
            },
            (err) => {
                console.error("[NGO-WS] GPS Error:", err.message);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 5000,
            }
        );

        watchIdRef.current = watchId;

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, [donationId, ngoName, enabled]);

    // ── Emit status update ──────────────────────────────────────────────
    const emitStatus = useCallback(
        (status: string) => {
            const socket = socketRef.current;
            if (socket?.connected && donationId) {
                socket.emit("tracking:status", { donationId, status });
            }
        },
        [donationId]
    );

    return { emitStatus, isConnected };
}
