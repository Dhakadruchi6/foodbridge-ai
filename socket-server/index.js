const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

// Basic health check
app.get("/", (req, res) => {
    res.send("FoodBridge Live Tracking Socket Server is running! 🚀");
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    },
    transports: ["polling", "websocket"], // Bridging firewalls/proxies
    connectTimeout: 10000,
    pingInterval: 10000, 
    pingTimeout: 5000,   // Faster disconnection detection
});

// Store last known state in memory (optional, for instant join sync)
const lastKnownPositions = new Map();
const lastKnownStatuses = new Map();

io.on("connection", (socket) => {
    console.log(`[SOCKET] User connected: ${socket.id} (Transport: ${socket.conn.transport.name})`);

    // --- Legacy Events (Backward Compatibility) ---
    socket.on("join-room", (donationId) => {
        if (!donationId) return;
        const room = typeof donationId === 'object' ? donationId.donationId : donationId;
        socket.join(room);
        console.log(`[SOCKET] JOIN-ROOM: ${socket.id} -> ${room}`);
        
        if (lastKnownPositions.has(room)) socket.emit("receive-location", lastKnownPositions.get(room));
        if (lastKnownStatuses.has(room)) socket.emit("status-updated", { donationId: room, status: lastKnownStatuses.get(room) });
    });

    socket.on("send-location", (data) => {
        if (!data.donationId) return;
        lastKnownPositions.set(data.donationId, data);
        io.to(data.donationId).emit("receive-location", data);
    });

    socket.on("status-update", (data) => {
        if (!data.donationId) return;
        lastKnownStatuses.set(data.donationId, data.status);
        io.to(data.donationId).emit("status-updated", data);
    });

    // --- NEW Tracking Events (Standardized) ---
    socket.on("tracking:join", (data) => {
        const donationId = data?.donationId;
        if (!donationId) return;
        
        socket.join(donationId);
        console.log(`[SOCKET] TRACKING:JOIN: ${socket.id} -> ${donationId}`);

        // Instant Sync on Join/Reconnect
        if (lastKnownPositions.has(donationId)) {
            socket.emit("tracking:location", lastKnownPositions.get(donationId));
        }
        if (lastKnownStatuses.has(donationId)) {
            socket.emit("tracking:status", { 
                donationId, 
                status: lastKnownStatuses.get(donationId),
                source: "server_sync"
            });
        }
    });

    socket.on("tracking:location", (data) => {
        if (!data.donationId) return;
        lastKnownPositions.set(data.donationId, data);
        io.to(data.donationId).emit("tracking:location", data);
    });

    socket.on("tracking:status", (data) => {
        if (!data.donationId) return;
        console.log(`[SOCKET] TRACKING:STATUS: ${data.donationId} -> ${data.status}`);
        lastKnownStatuses.set(data.donationId, data.status);
        io.to(data.donationId).emit("tracking:status", data);
    });

    socket.on("tracking:stop", (data) => {
        if (data?.donationId) {
            socket.leave(data.donationId);
            console.log(`[SOCKET] TRACKING:STOP: ${socket.id} left ${data.donationId}`);
        }
    });

    // --- Public Feed ---
    socket.on("join-public-feed", () => {
        socket.join("public-feed");
    });

    socket.on("broadcast-activity", (activity) => {
        io.to("public-feed").emit("new-activity", activity);
    });

    socket.on("disconnect", (reason) => {
        console.log(`[SOCKET] User disconnected: ${socket.id} (Reason: ${reason})`);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`\n🚀 Socket Server running on port ${PORT}`);
    console.log(`🔗 Transports: WebSockets + Polling\n`);
});
