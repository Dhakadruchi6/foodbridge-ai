"use client";

import { useRef, useEffect, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { Activity } from "@/types";

export function useActivityBroadcast() {

    useEffect(() => {
        const socket = getSocket();
        if (socket.connected) {
            console.log("[BROADCAST] Socket linked to global engine");
        }
        socket.on("connect", () => {
            console.log("[BROADCAST] Socket re-synced");
        });
        return () => {
            socket.off("connect");
        };
    }, []);

    const broadcastActivity = useCallback((activity: Omit<Activity, "_id" | "timestamp">) => {
        const socket = getSocket();
        if (socket?.connected) {
            const fullActivity: Activity = {
                ...activity,
                _id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toISOString(),
            };
            console.log("[BROADCAST] Emitting activity:", fullActivity.type);
            socket.emit("broadcast-activity", fullActivity);
        } else {
            console.warn("[BROADCAST] Socket not connected, could not emit activity");
        }
    }, []);

    return { broadcastActivity };
}
