// components/MobilePaymentActions.tsx
// Add this component to the pay page for better mobile UX

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Smartphone, ExternalLink, Copy, QrCode } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import { toast } from "sonner";

interface MobilePaymentActionsProps {
    walletAddress: string;
    amount: string;
    tokenSymbol: string;
    chainId: number;
}

export function MobilePaymentActions({
    walletAddress,
    amount,
    tokenSymbol,
    chainId,
}: MobilePaymentActionsProps) {
    const [isWalletDetected, setIsWalletDetected] = useState(false);

    // Detect if user has common mobile wallets
    const detectMobileWallet = () => {
        const userAgent = navigator.userAgent || navigator.vendor;

        // Check for common mobile wallet browsers
        const walletKeywords = [
            "Trust",
            "MetaMask",
            "CoinbaseWallet",
            "Rainbow",
            "imToken",
            "TokenPocket",
            "SafePal",
        ];

        return walletKeywords.some((wallet) => userAgent.includes(wallet));
    };

    const openWalletApp = () => {
        // Try to open wallet app with payment data
        const walletUrls = {
            metamask: `https://metamask.app.link/send/${walletAddress}?value=${amount}`,
            trust: `trust://send?asset=ethereum&amount=${amount}&to=${walletAddress}`,
            coinbase: `https://go.cb-w.com/send?address=${walletAddress}&amount=${amount}`,
        };

        // Try MetaMask first, then others
        try {
            window.location.href = walletUrls.metamask;
            toast.success("Opening wallet app...");
        } catch (error) {
            toast.error(
                "Could not open wallet app. Please use QR code instead."
            );
        }
    };

    const copyPaymentData = () => {
        const paymentText = `
Payment Details:
Amount: ${amount} ${tokenSymbol}
Address: ${walletAddress}
Network: ${chainId === 1 ? "Ethereum" : "Polygon"}

Send exactly ${amount} ${tokenSymbol} to complete payment.
        `.trim();

        copyToClipboard(paymentText);
    };

    return (
        <div className="lg:hidden space-y-3">
            <div className="flex gap-2">
                <Button onClick={openWalletApp} className="flex-1" size="lg">
                    <Wallet className="mr-2 h-4 w-4" />
                    Open Wallet App
                </Button>

                <Button
                    variant="outline"
                    onClick={() => copyToClipboard(walletAddress)}
                    size="lg"
                >
                    <Copy className="h-4 w-4" />
                </Button>
            </div>

            <Button
                variant="outline"
                onClick={copyPaymentData}
                className="w-full"
                size="sm"
            >
                <Smartphone className="mr-2 h-4 w-4" />
                Copy Payment Details
            </Button>

            <div className="text-center">
                <p className="text-xs text-muted-foreground">
                    Having trouble? Use the QR code above with your wallet app
                </p>
            </div>
        </div>
    );
}
