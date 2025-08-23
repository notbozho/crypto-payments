// api/src/websocket/server.ts

import { Server as HTTPServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { verify } from "jsonwebtoken";
import { prisma } from "@crypto-payments/db";
import "dotenv/config";
import { decode } from "@auth/core/jwt";
import { config } from "../config";

const REDIS_KEYS = {
    CONNECTION: (connectionId: string) => `ws:conn:${connectionId}`,
    USER_CONNECTIONS: (sellerId: string) => `ws:user:${sellerId}:connections`,
    SOCKET_TO_CONNECTION: (socketId: string) => `ws:socket:${socketId}`,
    PAYMENT_SUBSCRIBERS: (paymentLinkId: string) =>
        `ws:payment:${paymentLinkId}:subs`,
    CONNECTION_SUBSCRIPTIONS: (connectionId: string) =>
        `ws:conn:${connectionId}:subs`,
    RATE_LIMIT: (connectionId: string) => `ws:ratelimit:${connectionId}`,
    STATS_CONNECTIONS: "ws:stats:connections",
    STATS_EVENTS: "ws:stats:events",
    EVENT_CHANNEL: "ws:events",
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

interface RealtimeEvent {
    type: string;
    data: any;
    sellerId?: string;
    paymentLinkId?: string;
    connectionId?: string;
    broadcast?: boolean;
    timestamp: number;
}

export class WebSocketServer {
    private io: SocketServer;
    private redis: Redis;
    private pubClient: Redis;
    private subClient: Redis;

    constructor(httpServer: HTTPServer) {
        this.io = new SocketServer(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL,
                credentials: true,
            },
            pingTimeout: 60000,
            pingInterval: 25000,
            maxHttpBufferSize: 1e6,
        });

        this.setupAuthentication();
        this.setupEventHandlers();

        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

        this.redis = new Redis(redisUrl);
        this.pubClient = new Redis(redisUrl);
        this.subClient = new Redis(redisUrl);

        // Setup Socket.IO Redis adapter
        this.io.adapter(createAdapter(this.pubClient, this.subClient));

        // Subscribe to event distribution channel
        this.subClient.subscribe(REDIS_KEYS.EVENT_CHANNEL);
        this.subClient.on("message", (channel, message) => {
            if (channel === REDIS_KEYS.EVENT_CHANNEL) {
                this.handleDistributedEvent(JSON.parse(message));
            }
        });

        this.startCleanupTasks();
        console.log("✅ WebSocket server with Redis configured");
    }

    private setupAuthentication() {
        this.io.use(async (socket, next) => {
            try {
                const token =
                    socket.handshake.auth.token ||
                    socket.handshake.headers.authorization?.split(" ")[1] ||
                    socket.handshake.headers.cookie
                        ?.split("authjs.session-token=")[1]
                        ?.split(";")[0];

                if (!token) {
                    throw new Error("No authentication token provided");
                }

                console.log("a", process.env.AUTH_SECRET);
                const decoded = await decode({
                    token,
                    secret: config.authSecret,
                    salt: "",
                });

                if (!decoded || !decoded.id) {
                    throw new Error("Invalid session token");
                }
                const sellerId = decoded.id as string;

                const isBanned = await this.redis.get(`ban:${sellerId}`);
                if (isBanned) {
                    throw new Error("User is banned");
                }

                socket.data = {
                    sellerId,
                    email: decoded.email,
                    sessionToken: token,
                    ipAddress: socket.handshake.address,
                    userAgent:
                        socket.handshake.headers["user-agent"] || "Unknown",
                };

                next();
            } catch (error: any) {
                console.error(
                    "WebSocket authentication failed:",
                    error.message
                );
                next(new Error("Authentication failed"));
            }
        });
    }

    private setupEventHandlers() {
        this.io.on("connection", async (socket: Socket) => {
            await this.handleConnection(socket);

            socket.use(this.rateLimitMiddleware.bind(this));

            socket.on("subscribe_payment", (paymentLinkId: string) =>
                this.handlePaymentSubscription(socket, paymentLinkId)
            );
            socket.on("unsubscribe_payment", (paymentLinkId: string) =>
                this.handlePaymentUnsubscription(socket, paymentLinkId)
            );
            socket.on("ping", () => this.handlePing(socket));
            socket.on("disconnect", (reason) =>
                this.handleDisconnection(socket, reason)
            );
        });
    }

    private async handleConnection(socket: Socket) {
        const { sellerId, email, sessionToken, ipAddress, userAgent } =
            socket.data;
        const now = Date.now();

        try {
            const connectionId = `${sellerId}_${now}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;

            const connectionData: ConnectionData = {
                connectionId,
                socketId: socket.id,
                sellerId,
                email,
                ipAddress,
                userAgent,
                connectedAt: now,
                lastPingAt: now,
                messageCount: 0,
            };

            const pipeline = this.redis.pipeline();
            pipeline.hmset(
                REDIS_KEYS.CONNECTION(connectionId),
                connectionData as any
            );
            pipeline.expire(REDIS_KEYS.CONNECTION(connectionId), 24 * 60 * 60);
            pipeline.sadd(REDIS_KEYS.USER_CONNECTIONS(sellerId), connectionId);
            pipeline.expire(
                REDIS_KEYS.USER_CONNECTIONS(sellerId),
                24 * 60 * 60
            );
            pipeline.setex(
                REDIS_KEYS.SOCKET_TO_CONNECTION(socket.id),
                24 * 60 * 60,
                connectionId
            );
            pipeline.incr(REDIS_KEYS.STATS_CONNECTIONS);
            await pipeline.exec();

            socket.data.connectionId = connectionId;
            socket.join(`seller_${sellerId}`);

            socket.emit("connected", {
                connectionId,
                serverTime: now,
                subscribedEvents: [
                    "PAYMENT_DETECTED",
                    "PAYMENT_CONFIRMING",
                    "PAYMENT_PROCESSING",
                    "PAYMENT_COMPLETED",
                    "PAYMENT_FAILED",
                ],
            });

            console.log(`✅ WebSocket connected: ${connectionId}`);
        } catch (error) {
            console.error("Failed to handle WebSocket connection:", error);
            socket.disconnect(true);
        }
    }

    private async handlePaymentSubscription(
        socket: Socket,
        paymentLinkId: string
    ) {
        const { sellerId, connectionId } = socket.data;

        try {
            const ownershipKey = `payment:${paymentLinkId}:owner`;
            let owner = await this.redis.get(ownershipKey);

            if (!owner) {
                const paymentLink = await prisma.paymentLink.findFirst({
                    where: { id: paymentLinkId, sellerId },
                    select: { sellerId: true },
                });

                if (!paymentLink) {
                    socket.emit("error", {
                        message: "Payment link not found or unauthorized",
                    });
                    return;
                }

                await this.redis.setex(ownershipKey, 3600, sellerId);
                owner = sellerId;
            }

            if (owner !== sellerId) {
                socket.emit("error", {
                    message: "Unauthorized access to payment link",
                });
                return;
            }

            const pipeline = this.redis.pipeline();
            pipeline.sadd(
                REDIS_KEYS.PAYMENT_SUBSCRIBERS(paymentLinkId),
                connectionId
            );
            pipeline.expire(
                REDIS_KEYS.PAYMENT_SUBSCRIBERS(paymentLinkId),
                24 * 60 * 60
            );
            pipeline.sadd(
                REDIS_KEYS.CONNECTION_SUBSCRIPTIONS(connectionId),
                paymentLinkId
            );
            pipeline.expire(
                REDIS_KEYS.CONNECTION_SUBSCRIPTIONS(connectionId),
                24 * 60 * 60
            );
            await pipeline.exec();

            socket.join(`payment_${paymentLinkId}`);
            socket.emit("subscribed", { paymentLinkId, timestamp: Date.now() });
            console.log(`📡 Subscribed to payment: ${paymentLinkId}`);
        } catch (error) {
            console.error("Payment subscription failed:", error);
            socket.emit("error", { message: "Subscription failed" });
        }
    }

    private async handlePaymentUnsubscription(
        socket: Socket,
        paymentLinkId: string
    ) {
        const { connectionId } = socket.data;

        try {
            const pipeline = this.redis.pipeline();
            pipeline.srem(
                REDIS_KEYS.PAYMENT_SUBSCRIBERS(paymentLinkId),
                connectionId
            );
            pipeline.srem(
                REDIS_KEYS.CONNECTION_SUBSCRIPTIONS(connectionId),
                paymentLinkId
            );
            await pipeline.exec();

            socket.leave(`payment_${paymentLinkId}`);
            socket.emit("unsubscribed", {
                paymentLinkId,
                timestamp: Date.now(),
            });
        } catch (error) {
            console.error("Payment unsubscription failed:", error);
        }
    }

    private async handlePing(socket: Socket) {
        const { connectionId } = socket.data;
        const now = Date.now();

        try {
            await this.redis.hset(
                REDIS_KEYS.CONNECTION(connectionId),
                "lastPingAt",
                now
            );
            socket.emit("pong", { serverTime: now });
        } catch (error) {
            console.error("Ping handling failed:", error);
        }
    }

    private async handleDisconnection(socket: Socket, reason: string) {
        const { connectionId, sellerId } = socket.data;

        try {
            if (connectionId) {
                const subscriptions = await this.redis.smembers(
                    REDIS_KEYS.CONNECTION_SUBSCRIPTIONS(connectionId)
                );

                const pipeline = this.redis.pipeline();

                // Clean up subscriptions
                subscriptions.forEach((paymentLinkId) => {
                    pipeline.srem(
                        REDIS_KEYS.PAYMENT_SUBSCRIBERS(paymentLinkId),
                        connectionId
                    );
                });

                // Clean up connection data
                pipeline.del(REDIS_KEYS.CONNECTION(connectionId));
                pipeline.del(REDIS_KEYS.CONNECTION_SUBSCRIPTIONS(connectionId));
                pipeline.srem(
                    REDIS_KEYS.USER_CONNECTIONS(sellerId),
                    connectionId
                );
                pipeline.del(REDIS_KEYS.SOCKET_TO_CONNECTION(socket.id));
                pipeline.decr(REDIS_KEYS.STATS_CONNECTIONS);

                await pipeline.exec();
            }

            console.log(
                `❌ WebSocket disconnected: ${connectionId} (${reason})`
            );
        } catch (error) {
            console.error("Disconnection handling failed:", error);
        }
    }

    private async rateLimitMiddleware([event, ...args]: any[], next: Function) {
        const socket = this as any;
        const { connectionId } = socket.data;

        if (!connectionId) return next();

        try {
            const key = REDIS_KEYS.RATE_LIMIT(connectionId);
            const requests = await this.redis.incr(key);

            if (requests === 1) {
                await this.redis.expire(key, 60);
            }

            if (requests > 60) {
                socket.emit("rate_limit_exceeded", {
                    message: "Too many requests",
                    retryAfter: await this.redis.ttl(key),
                });
                return;
            }

            next();
        } catch (error) {
            console.error("Rate limiting failed:", error);
            next();
        }
    }

    public async broadcastEvent(event: RealtimeEvent) {
        try {
            await this.pubClient.publish(
                REDIS_KEYS.EVENT_CHANNEL,
                JSON.stringify(event)
            );
            await this.redis.incr(REDIS_KEYS.STATS_EVENTS);
        } catch (error) {
            console.error("Event broadcast failed:", error);
        }
    }

    private async handleDistributedEvent(event: RealtimeEvent) {
        try {
            const {
                type,
                data,
                sellerId,
                paymentLinkId,
                connectionId,
                broadcast,
            } = event;

            if (broadcast) {
                this.io.emit(type, data);
            } else if (connectionId) {
                const socketId = await this.redis.get(
                    REDIS_KEYS.SOCKET_TO_CONNECTION(connectionId)
                );
                if (socketId) {
                    this.io.to(socketId).emit(type, data);
                }
            } else if (paymentLinkId) {
                this.io.to(`payment_${paymentLinkId}`).emit(type, data);
            } else if (sellerId) {
                this.io.to(`seller_${sellerId}`).emit(type, data);
            }
        } catch (error) {
            console.error("Distributed event handling failed:", error);
        }
    }

    private startCleanupTasks() {
        setInterval(async () => {
            try {
                console.log("🧹 Running WebSocket cleanup...");
                // Additional cleanup logic can be added here
            } catch (error) {
                console.error("Cleanup task failed:", error);
            }
        }, 5 * 60 * 1000);
    }

    public async getStats() {
        try {
            const pipeline = this.redis.pipeline();
            pipeline.get(REDIS_KEYS.STATS_CONNECTIONS);
            pipeline.get(REDIS_KEYS.STATS_EVENTS);
            const results = (await pipeline.exec()) ?? [];

            return {
                totalConnections: parseInt((results[0]?.[1] as string) || "0"),
                totalEvents: parseInt((results[1]?.[1] as string) || "0"),
                timestamp: Date.now(),
            };
        } catch (error: any) {
            return { error: error.message, timestamp: Date.now() };
        }
    }
}

export function setupWebSocketServer(httpServer: HTTPServer) {
    return new WebSocketServer(httpServer);
}
