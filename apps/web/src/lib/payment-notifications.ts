// utils/payment-notifications.ts

import { toast } from "sonner";
import { CheckCircle, Clock, Zap, AlertTriangle, Loader2 } from "lucide-react";
import React from "react";

export const paymentNotifications = {
    detected: (txHash: string) => {
        toast.success("Payment Detected!", {
            icon: React.createElement(Zap, { className: "h-4 w-4" }),
            duration: 5000,
            action: {
                label: "View Transaction",
                onClick: () =>
                    window.open(`https://etherscan.io/tx/${txHash}`, "_blank"),
            },
        });
    },

    confirming: (confirmations: number, required: number) => {
        toast.info(`Confirmation ${confirmations}/${required}`, {
            icon: React.createElement(Clock, { className: "h-4 w-4" }),
            duration: 3000,
        });
    },

    processing: (step?: string) => {
        toast.info("Processing Payment", {
            icon: React.createElement(Loader2, {
                className: "h-4 w-4 animate-spin",
            }),
            duration: 4000,
        });
    },

    completed: (amount: string, token: string) => {
        toast.success("Payment Completed! 🎉", {
            icon: React.createElement(CheckCircle, { className: "h-4 w-4" }),
            duration: 8000,
            action: {
                label: "Close",
                onClick: () => toast.dismiss(),
            },
        });
    },

    failed: (error?: string) => {
        toast.error("Payment Failed", {
            icon: React.createElement(AlertTriangle, { className: "h-4 w-4" }),
            duration: 8000,
            action: {
                label: "Retry",
                onClick: () => window.location.reload(),
            },
        });
    },

    expired: () => {
        toast.error("Payment Expired", {
            description: "This payment link has expired",
            icon: React.createElement(Clock, { className: "h-4 w-4" }),
            duration: 6000,
        });
    },

    connectionLost: () => {
        toast.warning("Connection Lost", {
            description:
                "Real-time updates disabled. Payment will still process.",
            duration: 5000,
        });
    },

    connectionRestored: () => {
        toast.success("Connection Restored", {
            description: "Real-time updates are now active",
            duration: 3000,
        });
    },
};

// Add this to your pay store to use better notifications:
/*
    handlePaymentUpdate: (update: PaymentProgress) => {
        console.log("Payment update received:", update);
        
        set({ paymentProgress: update });

        switch (update.type) {
            case "PAYMENT_DETECTED":
                set((state) => ({
                    paymentLink: state.paymentLink ? {
                        ...state.paymentLink,
                        status: 'DETECTED'
                    } : null,
                    transactionHash: update.data.txHash || null,
                }));
                
                paymentNotifications.detected(update.data.txHash || '');
                break;

            case "PAYMENT_CONFIRMING":
                set((state) => ({
                    paymentLink: state.paymentLink ? {
                        ...state.paymentLink,
                        status: 'CONFIRMING'
                    } : null,
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
                    paymentLink: state.paymentLink ? {
                        ...state.paymentLink,
                        status: 'PROCESSING'
                    } : null,
                }));

                paymentNotifications.processing(update.data.step);
                break;

            case "PAYMENT_COMPLETED":
                set((state) => ({
                    paymentLink: state.paymentLink ? {
                        ...state.paymentLink,
                        status: 'COMPLETED'
                    } : null,
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
                    paymentLink: state.paymentLink ? {
                        ...state.paymentLink,
                        status: 'FAILED'
                    } : null,
                }));

                paymentNotifications.failed(update.data.error);
                break;
        }
    },
*/
