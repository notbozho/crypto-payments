import { setupWebSocketServer } from "./websocket/server";
import { RealtimePaymentNotifier } from "./websocket/notifier";
import { createServer } from "http";

const httpServer = createServer();
const wsServer = setupWebSocketServer(httpServer);
const notifier = new RealtimePaymentNotifier(wsServer);

// Test notification
setTimeout(async () => {
    await notifier.notifyPaymentDetected("test-payment-id", "test-seller-id", {
        txHash: "0x123",
        amount: "1000000000000000000",
    });
    console.log("Test notification sent");
}, 2000);

httpServer.listen(3002, () => {
    console.log("Test WebSocket server running on port 3002");
});
