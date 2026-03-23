/**
 * FoodBridge AI — Custom Next.js Server
 * Standard wrapper for Next.js since the Socket.IO logic 
 * has been moved to a dedicated standalone server.
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('[SERVER] Error handling request:', err);
            res.statusCode = 500;
            res.end('Internal Server Error');
        }
    }).listen(port, () => {
        console.log(`\n🚀 FoodBridge AI app running at http://${hostname}:${port}`);
        console.log(`📡 Real-time Socket.IO is now handled by the dedicated tracking server.`);
        console.log(`   Mode: ${dev ? 'development' : 'production'}\n`);
    });
});
