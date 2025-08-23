import { Router } from "express";
import { WebSocketUtils } from "../websocket/utils";

const router = Router();
const wsUtils = new WebSocketUtils();

// Get connection statistics
router.get("/stats", async (req, res) => {
    try {
        const stats = await wsUtils.getConnectionStats();
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get seller's active connections
router.get("/seller/:sellerId/connections", async (req, res) => {
    try {
        const { sellerId } = req.params;
        const connections = await wsUtils.getSellerConnections(sellerId);
        res.json({ connections });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get payment subscribers
router.get("/payment/:paymentLinkId/subscribers", async (req, res) => {
    try {
        const { paymentLinkId } = req.params;
        const subscribers = await wsUtils.getPaymentSubscribers(paymentLinkId);
        res.json({ subscribers });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Ban user
router.post("/ban/:sellerId", async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { duration } = req.body;
        await wsUtils.banUser(sellerId, duration);
        res.json({ message: "User banned successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Unban user
router.delete("/ban/:sellerId", async (req, res) => {
    try {
        const { sellerId } = req.params;
        await wsUtils.unbanUser(sellerId);
        res.json({ message: "User unbanned successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
