"use client";

import { useEffect, useRef, useState } from "react";
import { postRequest } from "@/lib/apiClient";

export function useLocationSync(donationId: string | null, isLive: boolean) {
    const [lastSynced, setLastSynced] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const lastUpdateRef = useRef<number>(0);

    useEffect(() => {
        if (!isLive || !donationId || typeof window === "undefined" || !navigator.geolocation) {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            return;
        }

        const syncLocation = async (lat: number, lon: number) => {
            const now = Date.now();
            // Throttle updates to once every 10 seconds
            if (now - lastUpdateRef.current < 10000) return;

            try {
                const res = await postRequest("/api/donations/live-location", {
                    donationId,
                    latitude: lat,
                    longitude: lon
                });
                if (res.success) {
                    setLastSynced(new Date());
                    lastUpdateRef.current = now;
                }
            } catch (err) {
                console.error("Failed to sync location:", err);
            }
        };

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                syncLocation(position.coords.latitude, position.coords.longitude);
            },
            (err) => {
                console.error("Geolocation error:", err);
                setError(err.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [donationId, isLive]);

    return { lastSynced, error };
}
