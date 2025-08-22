import Redis from "ioredis";

const REDIS_KEYS = {
    CONNECTION: (connectionId: string) => `ws:conn:${connectionId}`,
    USER_CONNECTIONS: (sellerId: string) => `ws:user:${sellerId}:connections`,
    PAYMENT_SUBSCRIBERS: (paymentLinkId: string) =>
        `ws:payment:${paymentLinkId}:subs`,
    STATS_CONNECTIONS: "ws:stats:connections",
} as const;

interface ConnectionData {
    connectionId: string;
    socketId: string;
    sellerId: string;
    email: string;
    ipAddress: string;
    userAgent: string;
    connectedAt: number;
    lastPingAt: number;
    messageCount: number;
}

export class WebSocketUtils {
    private redis: Redis;

    constructor() {
        this.redis = new Redis(
            process.env.REDIS_URL || "redis://localhost:6379"
        );
    }

    async getSellerConnections(sellerId: string): Promise<string[]> {
        return await this.redis.smembers(REDIS_KEYS.USER_CONNECTIONS(sellerId));
    }

    async getConnectionData(
        connectionId: string
    ): Promise<ConnectionData | null> {
        const data = await this.redis.hgetall(
            REDIS_KEYS.CONNECTION(connectionId)
        );
        return Object.keys(data).length > 0 ? (data as any) : null;
    }

    async getPaymentSubscribers(paymentLinkId: string): Promise<string[]> {
        return await this.redis.smembers(
            REDIS_KEYS.PAYMENT_SUBSCRIBERS(paymentLinkId)
        );
    }

    async banUser(
        sellerId: string,
        duration: number = 24 * 60 * 60
    ): Promise<void> {
        await this.redis.setex(`ban:${sellerId}`, duration, "1");
    }

    async unbanUser(sellerId: string): Promise<void> {
        await this.redis.del(`ban:${sellerId}`);
    }

    async getConnectionStats(): Promise<{ active: number; peak: number }> {
        const pipeline = this.redis.pipeline();
        pipeline.get(REDIS_KEYS.STATS_CONNECTIONS);
        pipeline.get("ws:stats:peak_connections");
        const results = await pipeline.exec();

        if (!results) {
            return { active: 0, peak: 0 };
        }

        const active = parseInt((results[0][1] as string) || "0");
        const peak = parseInt((results[1][1] as string) || "0");

        if (active > peak) {
            await this.redis.set("ws:stats:peak_connections", active);
        }

        return { active, peak: Math.max(active, peak) };
    }

    async disconnect(): Promise<void> {
        await this.redis.disconnect();
    }
}
