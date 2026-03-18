/**
 * FoodBridge AI — Custom WebSocket Server
 * Wraps Next.js with Socket.IO for Uber-style real-time NGO tracking.
 *
 * Each donation gets its own Socket.IO room keyed by donationId.
 * NGO emits "send-location" → server broadcasts to donors in room.
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory store for last-known positions (survives brief disconnects)
const lastKnownPositions = new Map(); // donationId → { lat, lng, timestamp, ngoName }
const activeRooms = new Map();        // donationId → Set of socketIds

app.prepare().then(() => {
    const httpServer = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('[SERVER] Error handling request:', err);
            res.statusCode = 500;
            res.end('Internal Server Error');
        }
    });

    const io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
        transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket) => {
        console.log(`[WS] Client connected: ${socket.id}`);

        // ─── JOIN ROOM ────────────────────────────────────────────────
        // Called by both NGO and Donor to subscribe to a donation's channel.
        socket.on('join-room', ({ donationId, role, userId }) => {
            socket.join(donationId);
            console.log(`[WS] ${role} (${userId}) joined room: ${donationId}`);

            // Track active clients in this room
            if (!activeRooms.has(donationId)) activeRooms.set(donationId, new Set());
            activeRooms.get(donationId).add(socket.id);

            // If there's a last-known position, send it immediately to the new joiner
            const lastPos = lastKnownPositions.get(donationId);
            if (lastPos) {
                socket.emit('receive-location', lastPos);
                console.log(`[WS] Sent last-known position to ${role}`);
            }

            // Notify room that a donor joined (NGO can see it)
            socket.to(donationId).emit('room-update', {
                type: 'joined',
                role,
                timestamp: new Date().toISOString(),
            });
        });

        // ─── NGO SENDS LOCATION ───────────────────────────────────────
        // Called by NGO every 2–3 seconds with their GPS coords.
        socket.on('send-location', ({ donationId, lat, lng, ngoName, accuracy }) => {
            const payload = {
                donationId,
                lat,
                lng,
                ngoName,
                accuracy,
                timestamp: Date.now(),
            };

            // Persist as last-known position
            lastKnownPositions.set(donationId, payload);

            // Broadcast to all donors in the room (exclude sender)
            socket.to(donationId).emit('receive-location', payload);
        });

        // ─── STATUS UPDATE ────────────────────────────────────────────
        // NGO updates mission status → synced to donors in real time.
        socket.on('update-status', ({ donationId, status, ngoName }) => {
            const payload = { donationId, status, ngoName, timestamp: Date.now() };
            io.to(donationId).emit('status-changed', payload);
            console.log(`[WS] Status update in room ${donationId}: ${status}`);
        });

        // ─── NGO STOPS TRACKING ───────────────────────────────────────
        socket.on('stop-tracking', ({ donationId }) => {
            io.to(donationId).emit('tracking-stopped', {
                donationId,
                timestamp: Date.now(),
            });
            lastKnownPositions.delete(donationId);
            console.log(`[WS] Tracking stopped for donation: ${donationId}`);
        });

        // ─── DISCONNECT ───────────────────────────────────────────────
        socket.on('disconnect', () => {
            console.log(`[WS] Client disconnected: ${socket.id}`);

            // Clean up room membership
            for (const [donationId, members] of activeRooms.entries()) {
                if (members.has(socket.id)) {
                    members.delete(socket.id);
                    if (members.size === 0) {
                        activeRooms.delete(donationId);
                    }

                    // Notify other room members
                    socket.to(donationId).emit('peer-disconnected', {
                        socketId: socket.id,
                        timestamp: Date.now(),
                    });
                }
            }
        });
    });

    httpServer.listen(port, () => {
        console.log(`\n🚀 FoodBridge AI server running at http://${hostname}:${port}`);
        console.log(`🔌 Socket.IO WebSocket server active`);
        console.log(`   Mode: ${dev ? 'development' : 'production'}\n`);
    });
});
