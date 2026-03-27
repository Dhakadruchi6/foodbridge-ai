const io = require('socket.io-client');

const SOCKET_URL = "https://foodbridge-ai-nk8s.onrender.com";

async function testConnection(transport) {
    console.log(`Testing ${transport} connection...`);
    const socket = io(SOCKET_URL, {
        transports: [transport],
        reconnection: false
    });

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            socket.disconnect();
            reject(new Error(`${transport} connection timed out`));
        }, 5000);

        socket.on('connect', () => {
            clearTimeout(timeout);
            console.log(`✅ ${transport} connected successfully!`);
            socket.disconnect();
            resolve();
        });

        socket.on('connect_error', (err) => {
            clearTimeout(timeout);
            socket.disconnect();
            reject(new Error(`${transport} failed: ${err.message}`));
        });
    });
}

async function runTests() {
    try {
        await testConnection('polling');
        await testConnection('websocket');
        console.log("\nAll transport tests passed! 🚀");
        process.exit(0);
    } catch (err) {
        console.error("\n❌ Test failed:", err.message);
        process.exit(1);
    }
}

runTests();
