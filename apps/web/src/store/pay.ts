// store/pay.ts

import { create } from "zustand";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import { paymentNotifications } from "@/lib/payment-notifications";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface PaymentLinkDetails {
    id: string;
    chainId: number;
    chainName: string;
    tokenSymbol: string;
    tokenName: string;
    tokenDecimals: number;
    tokenAddress: string | null;
    amount: string;
    amountUSD: number;
    description?: string;
    walletAddress: string;
    status:
        | "PENDING"
        | "DETECTED"
        | "CONFIRMING"
        | "PROCESSING"
        | "COMPLETED"
        | "FAILED"
        | "EXPIRED"
        | "CANCELLED";
    expiresAt: string;
    minimumConfirmations: number;
    seller: {
        name?: string;
        email: string;
    };
    createdAt: string;
}

export interface PaymentProgress {
    type:
        | "PAYMENT_DETECTED"
        | "PAYMENT_CONFIRMING"
        | "PAYMENT_PROCESSING"
        | "PAYMENT_COMPLETED"
        | "PAYMENT_FAILED";
    data: {
        paymentLinkId: string;
        txHash?: string;
        amount?: string;
        blockNumber?: string;
        confirmations?: number;
        required?: number;
        progress?: number;
        step?: string;
        finalAmount?: string;
        gasCost?: string;
        error?: string;
        timestamp: number;
    };
}

interface ApiError {
    response?: {
        data?: {
            error?: string;
        };
    };
    message: string;
}

interface PayState {
    // Payment link data
    paymentLink: PaymentLinkDetails | null;

    // Payment progress
    paymentProgress: PaymentProgress | null;
    transactionHash: string | null;
    confirmations: number;
    requiredConfirmations: number;

    // UI state
    loading: {
        paymentLink: boolean;
        connecting: boolean;
    };
    errors: {
        paymentLink: string | null;
        connection: string | null;
    };

    // WebSocket connection
    socket: Socket | null;
    connectionStatus: "connecting" | "connected" | "disconnected" | "error";

    // Time remaining
    timeRemaining: number;
    isExpired: boolean;

    // Actions
    fetchPaymentLink: (id: string) => Promise<void>;
    connectWebSocket: (paymentLinkId: string) => void;
    disconnectWebSocket: () => void;
    updateTimeRemaining: () => void;
    handlePaymentUpdate: (update: PaymentProgress) => void;
    reset: () => void;
    clearErrors: () => void;
}

const handleApiError = (error: ApiError): string => {
    if (error.response?.data?.error) {
        return error.response.data.error;
    }
    if (error.message) {
        return error.message;
    }
    return "An unexpected error occurred";
};

const makeApiCall = async <T>(
    url: string,
    options: RequestInit = {}
): Promise<T> => {
    const response = await fetch(`${API_URL}${url}`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        ...options,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data.success ? data.data : data;
};

export const usePayStore = create<PayState>((set, get) => ({
    // Initial state
    paymentLink: null,
    paymentProgress: null,
    transactionHash: null,
    confirmations: 0,
    requiredConfirmations: 3,

    loading: {
        paymentLink: false,
        connecting: false,
    },

    errors: {
        paymentLink: null,
        connection: null,
    },

    socket: null,
    connectionStatus: "disconnected",
    timeRemaining: 0,
    isExpired: false,

    fetchPaymentLink: async (id: string) => {
        set((state) => ({
            loading: { ...state.loading, paymentLink: true },
            errors: { ...state.errors, paymentLink: null },
        }));

        try {
            const paymentLink = await makeApiCall<PaymentLinkDetails>(
                `/payments/public/${id}`
            );

            const now = Date.now();
            const expiresAt = new Date(paymentLink.expiresAt).getTime();
            const timeRemaining = Math.max(0, expiresAt - now);
            const isExpired =
                timeRemaining === 0 || paymentLink.status === "EXPIRED";

            set((state) => ({
                paymentLink,
                timeRemaining,
                isExpired,
                requiredConfirmations: paymentLink.minimumConfirmations,
                loading: { ...state.loading, paymentLink: false },
            }));

            // Connect WebSocket for real-time updates
            if (!isExpired && paymentLink.status === "PENDING") {
                get().connectWebSocket(id);
            }
        } catch (error) {
            const errorMessage = handleApiError(error as ApiError);
            console.error("Failed to fetch payment link:", error);

            set((state) => ({
                loading: { ...state.loading, paymentLink: false },
                errors: { ...state.errors, paymentLink: errorMessage },
            }));
        }
    },

    handlePaymentUpdate: (update: PaymentProgress) => {
        console.log("Payment update received:", update);

        set({ paymentProgress: update });

        switch (update.type) {
            case "PAYMENT_DETECTED":
                set((state) => ({
                    paymentLink: state.paymentLink
                        ? {
                              ...state.paymentLink,
                              status: "DETECTED",
                          }
                        : null,
                    transactionHash: update.data.txHash || null,
                }));

                paymentNotifications.detected(update.data.txHash || "");
                break;

            case "PAYMENT_CONFIRMING":
                set((state) => ({
                    paymentLink: state.paymentLink
                        ? {
                              ...state.paymentLink,
                              status: "CONFIRMING",
                          }
                        : null,
                    confirmations: update.data.confirmations || 0,
                }));

                if (update.data.confirmations && update.data.required) {
                    paymentNotifications.confirming(
                        update.data.confirmations,
                        update.data.required
                    );
                }
                break;

            case "PAYMENT_PROCESSING":
                set((state) => ({
                    paymentLink: state.paymentLink
                        ? {
                              ...state.paymentLink,
                              status: "PROCESSING",
                          }
                        : null,
                }));

                paymentNotifications.processing(update.data.step);
                break;

            case "PAYMENT_COMPLETED":
                set((state) => ({
                    paymentLink: state.paymentLink
                        ? {
                              ...state.paymentLink,
                              status: "COMPLETED",
                          }
                        : null,
                }));

                const paymentLink = get().paymentLink;
                if (paymentLink) {
                    paymentNotifications.completed(
                        paymentLink.amount,
                        paymentLink.tokenSymbol
                    );
                }

                setTimeout(() => get().disconnectWebSocket(), 3000);
                break;

            case "PAYMENT_FAILED":
                set((state) => ({
                    paymentLink: state.paymentLink
                        ? {
                              ...state.paymentLink,
                              status: "FAILED",
                          }
                        : null,
                }));

                paymentNotifications.failed(update.data.error);
                break;
        }
    },

    connectWebSocket: (paymentLinkId: string) => {
        const { socket } = get();

        // Close existing connection
        if (socket) {
            socket.disconnect();
        }

        set({ connectionStatus: "connecting" });

        try {
            const newSocket = io(
                process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001",
                {
                    transports: ["websocket"],
                    timeout: 10000,
                }
            );

            newSocket.on("connect", () => {
                console.log("WebSocket connected");
                set({ connectionStatus: "connected", socket: newSocket });

                // Subscribe to payment updates
                newSocket.emit("subscribe_payment", paymentLinkId);
            });

            newSocket.on("disconnect", (reason) => {
                console.log("WebSocket disconnected:", reason);
                set({ connectionStatus: "disconnected" });
            });

            newSocket.on("connect_error", (error) => {
                console.error("WebSocket connection error:", error);
                set({
                    connectionStatus: "error",
                    errors: {
                        ...get().errors,
                        connection: "Failed to connect to payment updates",
                    },
                });
            });

            // Payment event listeners
            newSocket.on("PAYMENT_DETECTED", (data) => {
                get().handlePaymentUpdate({ type: "PAYMENT_DETECTED", data });
            });

            newSocket.on("PAYMENT_CONFIRMING", (data) => {
                get().handlePaymentUpdate({ type: "PAYMENT_CONFIRMING", data });
            });

            newSocket.on("PAYMENT_PROCESSING", (data) => {
                get().handlePaymentUpdate({ type: "PAYMENT_PROCESSING", data });
            });

            newSocket.on("PAYMENT_COMPLETED", (data) => {
                get().handlePaymentUpdate({ type: "PAYMENT_COMPLETED", data });
            });

            newSocket.on("PAYMENT_FAILED", (data) => {
                get().handlePaymentUpdate({ type: "PAYMENT_FAILED", data });
            });

            set({ socket: newSocket });
        } catch (error) {
            console.error("Failed to create WebSocket connection:", error);
            set({
                connectionStatus: "error",
                errors: {
                    ...get().errors,
                    connection: "Failed to establish real-time connection",
                },
            });
        }
    },

    disconnectWebSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, connectionStatus: "disconnected" });
        }
    },

    updateTimeRemaining: () => {
        const { paymentLink } = get();
        if (!paymentLink) return;

        const now = Date.now();
        const expiresAt = new Date(paymentLink.expiresAt).getTime();
        const timeRemaining = Math.max(0, expiresAt - now);
        const isExpired = timeRemaining === 0;

        set({ timeRemaining, isExpired });

        if (isExpired && paymentLink.status === "PENDING") {
            // Update payment link status to expired
            set((state) => ({
                paymentLink: state.paymentLink
                    ? {
                          ...state.paymentLink,
                          status: "EXPIRED",
                      }
                    : null,
            }));

            // Disconnect WebSocket
            get().disconnectWebSocket();
        }
    },

    reset: () => {
        get().disconnectWebSocket();
        set({
            paymentLink: null,
            paymentProgress: null,
            transactionHash: null,
            confirmations: 0,
            requiredConfirmations: 3,
            loading: { paymentLink: false, connecting: false },
            errors: { paymentLink: null, connection: null },
            socket: null,
            connectionStatus: "disconnected",
            timeRemaining: 0,
            isExpired: false,
        });
    },

    clearErrors: () => {
        set((state) => ({
            errors: { ...state.errors, paymentLink: null, connection: null },
        }));
    },
}));
