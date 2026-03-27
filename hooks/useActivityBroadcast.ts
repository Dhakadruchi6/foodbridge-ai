"use client";

import { useRef, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Activity } from "@/types";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://foodbridge-ai-nk8s.onrender.com";

export function useActivityBroadcast() {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!socketUrl) return;

        const socket = io(socketUrl, {
            transports: ["websocket"],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on("connect", () => {
            console.log("[BROADCAST] Socket connected");
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
        };
    }, []);

    const broadcastActivity = useCallback((activity: Omit<Activity, "_id" | "timestamp">) => {
        if (socketRef.current?.connected) {
            const fullActivity: Activity = {
                ...activity,
                _id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toISOString(),
            };
            console.log("[BROADCAST] Emitting activity:", fullActivity.type);
            socketRef.current.emit("broadcast-activity", fullActivity);
        } else {
            console.warn("[BROADCAST] Socket not connected, could not emit activity");
        }
    }, []);

    return { broadcastActivity };
}
