"use client";

/**
 * useWebSocketLocation — NGO side
 * Streams GPS to the Socket.IO server every 2-3 seconds.
 * Also emits status updates via WebSocket for instant donor sync.
 */

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

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
    const socketRef = useRef<Socket | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const lastEmitRef = useRef<number>(0);
    const THROTTLE_MS = 2500; // 2.5 seconds

    // ── Connect & join room ─────────────────────────────────────────────
    useEffect(() => {
        if (!donationId || !userId || !enabled) return;

        const socket = io(window.location.origin, {
            transports: ["websocket", "polling"],
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
        });

        socket.on("connect", () => {
            console.log("[NGO-WS] Connected:", socket.id);
            socket.emit("join-room", { donationId, role: "ngo", userId });
        });

        socket.on("disconnect", () => {
            console.log("[NGO-WS] Disconnected");
        });

        socketRef.current = socket;

        return () => {
            socket.emit("stop-tracking", { donationId });
            socket.disconnect();
            socketRef.current = null;
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
                const socket = socketRef.current;

                if (socket?.connected) {
                    socket.emit("send-location", {
                        donationId,
                        lat,
                        lng,
                        ngoName,
                        accuracy,
                    });
                }
            },
            (err) => {
                console.error("[NGO-WS] GPS Error:", err.message);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 10000,
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
                socket.emit("update-status", { donationId, status, ngoName });
            }
        },
        [donationId, ngoName]
    );

    return { emitStatus, isConnected: socketRef.current?.connected ?? false };
}
