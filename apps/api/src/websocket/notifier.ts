import { WebSocketServer } from "./server";

interface RealtimeEvent {
    type: string;
    data: any;
    sellerId?: string;
    paymentLinkId?: string;
    connectionId?: string;
    broadcast?: boolean;
    timestamp: number;
}

export class RealtimePaymentNotifier {
    constructor(private wsServer: WebSocketServer) {}

    async notifyPaymentDetected(
        paymentLinkId: string,
        sellerId: string,
        data: any
    ) {
        await this.wsServer.broadcastEvent({
            type: "PAYMENT_DETECTED",
            sellerId,
            paymentLinkId,
            timestamp: Date.now(),
            data: { ...data, timestamp: Date.now() },
        });
    }

    async notifyPaymentConfirming(
        paymentLinkId: string,
        sellerId: string,
        confirmations: number,
        required: number
    ) {
        await this.wsServer.broadcastEvent({
            type: "PAYMENT_CONFIRMING",
            sellerId,
            paymentLinkId,
            timestamp: Date.now(),
            data: {
                paymentLinkId,
                confirmations,
                required,
                progress: Math.min(100, (confirmations / required) * 100),
                timestamp: Date.now(),
            },
        });
    }

    async notifyPaymentProcessing(
        paymentLinkId: string,
        sellerId: string,
        step: string,
        progress: number
    ) {
        await this.wsServer.broadcastEvent({
            type: "PAYMENT_PROCESSING",
            sellerId,
            paymentLinkId,
            timestamp: Date.now(),
            data: {
                paymentLinkId,
                step,
                progress,
                timestamp: Date.now(),
            },
        });
    }

    async notifyPaymentCompleted(
        paymentLinkId: string,
        sellerId: string,
        finalAmount: string,
        gasCost: string
    ) {
        await this.wsServer.broadcastEvent({
            type: "PAYMENT_COMPLETED",
            sellerId,
            paymentLinkId,
            timestamp: Date.now(),
            data: {
                paymentLinkId,
                finalAmount,
                gasCost,
                completedAt: Date.now(),
                timestamp: Date.now(),
            },
        });
    }

    async notifyPaymentFailed(
        paymentLinkId: string,
        sellerId: string,
        error: string,
        step?: string
    ) {
        await this.wsServer.broadcastEvent({
            type: "PAYMENT_FAILED",
            sellerId,
            paymentLinkId,
            timestamp: Date.now(),
            data: {
                paymentLinkId,
                error,
                step,
                timestamp: Date.now(),
            },
        });
    }
}
