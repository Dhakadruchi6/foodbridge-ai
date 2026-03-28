"use client";

/**
 * useWebSocketLocation — NGO side
 * Streams GPS to the Socket.IO server every 2-3 seconds.
 * Also emits status updates via WebSocket for instant donor sync.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { getSocket } from "@/lib/socket";
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
    const watchIdRef = useRef<number | null>(null);
    const lastEmitRef = useRef<number>(0);
    const lastDbSyncRef = useRef<number>(0);
    const THROTTLE_MS = 1200; // WebSocket: 1.2 seconds (Blinkit speed)
    const DB_SYNC_MS = 10000;   // Database: 10 seconds (less frequent to save bandwidth)
    const MOVEMENT_THRESHOLD = 0.000005; // ~0.5 meters
    const lastPosRef = useRef<{ lat: number, lng: number } | null>(null);

    // ── Connect & join room (Global Singleton) ──────────────────────────
    useEffect(() => {
        if (!donationId || !userId || !enabled) return;

        const socket = getSocket();
        
        const handleJoin = () => {
            console.log("[WS-TRACK] NGO Syncing Room:", donationId);
            socket.emit("join-room", { donationId });
            socket.emit("tracking:join", { donationId });
            setIsConnected(true);
        };

        if (socket.connected) {
            handleJoin();
        }

        socket.on("connect", handleJoin);

        socket.on("reconnect", (attempt: number) => {
            console.log(`[WS-TRACK] NGO Connection Restored (Attempt ${attempt})`);
            handleJoin();
        });

        socket.on("disconnect", (reason: string) => {
            console.warn("[WS-TRACK] NGO Link Dropped:", reason);
            setIsConnected(false);
        });

        socket.on("connect_error", (error: Error) => {
            setIsConnected(false);
        });

        return () => {
            socket.off("connect", handleJoin);
            socket.off("reconnect");
            socket.off("disconnect");
            socket.off("connect_error");
        };
    }, [donationId, userId, enabled]);

    const [retryCount, setRetryCount] = useState(0);

    // ── GPS Watcher ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!enabled || typeof window === 'undefined' || !navigator.geolocation) return;

        console.log("[NGO-WS] Initializing high-accuracy GPS stream...");

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const now = Date.now();
                if (now - lastEmitRef.current < THROTTLE_MS) return;
                lastEmitRef.current = now;

                const { latitude: lat, longitude: lng, accuracy } = position.coords;
                console.log(`[NGO-GPS] Sending location: ${lat.toFixed(6)}, ${lng.toFixed(6)} (Acc: ${accuracy.toFixed(1)}m)`);

                // ─── STOPPED DETECTION ───
                if (lastPosRef.current) {
                    const dLat = Math.abs(lat - lastPosRef.current.lat);
                    const dLng = Math.abs(lng - lastPosRef.current.lng);
                    if (dLat < MOVEMENT_THRESHOLD && dLng < MOVEMENT_THRESHOLD) {
                        // Still pulsing to keep signal alive
                    }
                }
                lastPosRef.current = { lat, lng };

                const socket = getSocket();

                if (socket?.connected) {
                    const payload = {
                        donationId,
                        lat,
                        lng,
                        accuracy,
                        updated_at: new Date().toISOString()
                    };
                    socket.emit("send-location", payload);
                    socket.emit("tracking:location", payload);
                }

                // ─── DB SYNC FALLBACK (Every 30s) ───
                if (now - lastDbSyncRef.current > 30000) {
                    lastDbSyncRef.current = now;
                    postRequest(`/api/donation/${donationId}/location`, { lat, lng }).catch(() => {});
                }
            },
            (err) => {
                console.error("[NGO-WS] GPS Error:", err.message);
                if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
                    console.log("[NGO-WS] Attempting GPS restart in 5s...");
                    setTimeout(() => setRetryCount(prev => prev + 1), 5000);
                }
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 30000,
            }
        );

        watchIdRef.current = watchId;

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [donationId, enabled, retryCount]);

    // ── Emit status update ──────────────────────────────────────────────
    const emitStatus = useCallback(
        (status: string) => {
            const socket = getSocket();
            if (socket?.connected && donationId) {
                socket.emit("tracking:status", { donationId, status });
            }
        },
        [donationId]
    );

    return { emitStatus, isConnected };
}
