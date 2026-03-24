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
        origin: "*", // In production, replace with your frontend URL
        methods: ["GET", "POST"]
    },
    transports: ["websocket"]
});

// Store last known positions in memory (optional, for instant join sync)
const lastKnownPositions = new Map();

io.on("connection", (socket) => {
    console.log(`[SOCKET] User connected: ${socket.id}`);

    // Join room using donation ID
    socket.on("join-room", (donationId) => {
        if (!donationId) return;
        socket.join(donationId);
        console.log(`[SOCKET] Socket ${socket.id} joined room: ${donationId}`);
        
        // If we have a last position, sends it immediately
        const lastPos = lastKnownPositions.get(donationId);
        if (lastPos) {
            socket.emit("receive-location", lastPos);
        }
    });

    // Handle incoming location from NGO
    socket.on("send-location", (data) => {
        if (!data.donationId) return;
        console.log(`[SOCKET] Location update for ${data.donationId}:`, data.lat, data.lng);
        
        // Update memory
        lastKnownPositions.set(data.donationId, data);
        
        // Broadcast to everyone in the room (donors, admins, etc.)
        io.to(data.donationId).emit("receive-location", data);
    });

    // Handle mission status updates
    socket.on("update-status", (data) => {
        if (!data.donationId) return;
        io.to(data.donationId).emit("status-changed", data);
    });

    // Join public activity feed
    socket.on("join-public-feed", () => {
        socket.join("public-feed");
        console.log(`[SOCKET] Socket ${socket.id} joined public feed`);
    });

    // Broadcast new activity to everyone in public feed
    socket.on("broadcast-activity", (activity) => {
        console.log(`[SOCKET] New Activity:`, activity.type, activity.title);
        io.to("public-feed").emit("new-activity", activity);
    });

    socket.on("disconnect", () => {
        console.log(`[SOCKET] User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`\n🚀 Socket Server running on port ${PORT}`);
    console.log(`🔗 Primary Transport: WebSockets Only\n`);
});
