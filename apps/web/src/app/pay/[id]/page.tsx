// app/pay/[id]/page.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
    Clock,
    Copy,
    ExternalLink,
    Wallet,
    CheckCircle,
    AlertTriangle,
    Loader2,
    RefreshCw,
    AlertCircle,
    QrCode,
    ArrowRight,
    ShieldCheck,
    Zap,
    Timer,
    Info,
} from "lucide-react";

import { usePayStore } from "@/store/pay";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { copyToClipboard, formatAddress, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { MobilePaymentActions } from "@/app/pay/components/MobilePaymentActions";

interface QRCodeDisplayProps {
    address: string;
    amount?: string;
    chainId?: number;
}

function QRCodeDisplay({ address, amount, chainId }: QRCodeDisplayProps) {
    const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        generateQRCode();
    }, [address, amount, chainId]);

    const generateQRCode = async () => {
        try {
            setLoading(true);

            // Create payment URI - different formats for different chains
            let paymentURI = address;

            if (chainId === 1) {
                // Ethereum
                paymentURI = `ethereum:${address}`;
                if (amount) {
                    paymentURI += `?value=${amount}`;
                }
            }

            const dataURL = await QRCode.toDataURL(paymentURI, {
                width: 200,
                margin: 2,
                color: {
                    dark: "#000000",
                    light: "#FFFFFF",
                },
            });

            setQrCodeDataURL(dataURL);
        } catch (error) {
            console.error("Error generating QR code:", error);
            toast.error("Failed to generate QR code");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="relative">
                {loading ? (
                    <div className="w-48 h-48 border border-border rounded-lg flex items-center justify-center bg-muted/50">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <div className="relative group">
                        <img
                            src={qrCodeDataURL}
                            alt="Payment QR Code"
                            className="w-48 h-48 border border-border rounded-lg bg-white p-2"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                            <QrCode className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                )}
            </div>
            <p className="text-sm text-muted-foreground text-center">
                Scan with your wallet app to make payment
            </p>
        </div>
    );
}

function CountdownTimer() {
    const { timeRemaining, isExpired, updateTimeRemaining } = usePayStore();

    useEffect(() => {
        const interval = setInterval(() => {
            updateTimeRemaining();
        }, 1000);

        return () => clearInterval(interval);
    }, [updateTimeRemaining]);

    if (isExpired) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Payment Expired</AlertTitle>
                <AlertDescription>
                    This payment link has expired and can no longer accept
                    payments.
                </AlertDescription>
            </Alert>
        );
    }

    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor(
        (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
    );
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    const isUrgent = timeRemaining < 10 * 60 * 1000; // Less than 10 minutes

    return (
        <div
            className={`flex items-center gap-2 p-3 rounded-lg border ${
                isUrgent
                    ? "bg-orange-50 border-orange-200 text-orange-900"
                    : "bg-muted/50"
            }`}
        >
            <Timer
                className={`h-4 w-4 ${
                    isUrgent ? "text-orange-600" : "text-muted-foreground"
                }`}
            />
            <span className="text-sm font-medium">
                {hours > 0 && `${hours}h `}
                {minutes}m {seconds}s remaining
            </span>
        </div>
    );
}

function PaymentStatus() {
    const {
        paymentLink,
        paymentProgress,
        transactionHash,
        confirmations,
        requiredConfirmations,
        connectionStatus,
    } = usePayStore();

    if (!paymentLink) return null;

    const getStatusIcon = () => {
        switch (paymentLink.status) {
            case "PENDING":
                return <Clock className="h-5 w-5 text-blue-500" />;
            case "DETECTED":
                return <Zap className="h-5 w-5 text-yellow-500" />;
            case "CONFIRMING":
                return (
                    <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
                );
            case "PROCESSING":
                return (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                );
            case "COMPLETED":
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case "FAILED":
                return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case "EXPIRED":
                return <Clock className="h-5 w-5 text-gray-500" />;
            default:
                return <Clock className="h-5 w-5 text-gray-500" />;
        }
    };

    const getStatusText = () => {
        switch (paymentLink.status) {
            case "PENDING":
                return "Waiting for payment";
            case "DETECTED":
                return "Payment detected";
            case "CONFIRMING":
                return `Confirming transaction (${confirmations}/${requiredConfirmations})`;
            case "PROCESSING":
                return "Processing payment";
            case "COMPLETED":
                return "Payment completed";
            case "FAILED":
                return "Payment failed";
            case "EXPIRED":
                return "Payment expired";
            default:
                return "Unknown status";
        }
    };

    const getStatusColor = () => {
        switch (paymentLink.status) {
            case "PENDING":
                return "bg-blue-50 text-blue-700 border-blue-200";
            case "DETECTED":
            case "CONFIRMING":
                return "bg-yellow-50 text-yellow-700 border-yellow-200";
            case "PROCESSING":
                return "bg-blue-50 text-blue-700 border-blue-200";
            case "COMPLETED":
                return "bg-green-50 text-green-700 border-green-200";
            case "FAILED":
                return "bg-red-50 text-red-700 border-red-200";
            case "EXPIRED":
                return "bg-gray-50 text-gray-700 border-gray-200";
            default:
                return "bg-gray-50 text-gray-700 border-gray-200";
        }
    };

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center gap-3">
                    {getStatusIcon()}
                    <div className="flex-1">
                        <p className="font-medium">{getStatusText()}</p>
                        {connectionStatus === "connected" &&
                            paymentLink.status === "PENDING" && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    Live updates enabled
                                </p>
                            )}
                    </div>
                    <Badge className={getStatusColor()}>
                        {paymentLink.status.toLowerCase()}
                    </Badge>
                </div>

                {paymentLink.status === "CONFIRMING" && (
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span>Confirmations</span>
                            <span>
                                {confirmations}/{requiredConfirmations}
                            </span>
                        </div>
                        <Progress
                            value={
                                (confirmations / requiredConfirmations) * 100
                            }
                            className="h-2"
                        />
                    </div>
                )}

                {transactionHash && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Transaction Hash
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono">
                                    {formatAddress(transactionHash)}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        copyToClipboard(transactionHash)
                                    }
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {paymentProgress?.data?.step && (
                    <div className="mt-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Step: {paymentProgress.data.step}</span>
                        </div>
                        {paymentProgress.data.progress && (
                            <Progress
                                value={paymentProgress.data.progress}
                                className="h-2 mt-2"
                            />
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function PaymentInstructions() {
    const { paymentLink } = usePayStore();

    if (!paymentLink) return null;

    const blockExplorerUrl = `https://etherscan.io/address/${paymentLink.walletAddress}`;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Payment Instructions
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                            1
                        </div>
                        <div>
                            <p className="font-medium">Open your wallet</p>
                            <p className="text-sm text-muted-foreground">
                                Use any wallet app (MetaMask, Trust Wallet,
                                etc.)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                            2
                        </div>
                        <div>
                            <p className="font-medium">Send exact amount</p>
                            <p className="text-sm text-muted-foreground">
                                Send exactly{" "}
                                <strong>
                                    {paymentLink.amount}{" "}
                                    {paymentLink.tokenSymbol}
                                </strong>{" "}
                                to the address below
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                            3
                        </div>
                        <div>
                            <p className="font-medium">Wait for confirmation</p>
                            <p className="text-sm text-muted-foreground">
                                Your payment will be confirmed after{" "}
                                {paymentLink.minimumConfirmations} block
                                confirmations
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                        <Label className="text-sm font-medium text-muted-foreground">
                            Payment Address
                        </Label>
                        <div className="flex items-center justify-between mt-1">
                            <span className="font-mono text-sm break-all">
                                {paymentLink.walletAddress}
                            </span>
                            <div className="flex items-center gap-1 ml-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        copyToClipboard(
                                            paymentLink.walletAddress
                                        )
                                    }
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        window.open(blockExplorerUrl, "_blank")
                                    }
                                >
                                    <ExternalLink className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Alert>
                        <ShieldCheck className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Security Notice:</strong> Only send{" "}
                            {paymentLink.tokenSymbol} tokens on the{" "}
                            {paymentLink.chainName} network. Sending other
                            tokens or using wrong networks will result in
                            permanent loss of funds.
                        </AlertDescription>
                    </Alert>
                </div>
            </CardContent>
        </Card>
    );
}

function PaymentDetails() {
    const { paymentLink } = usePayStore();

    if (!paymentLink) return null;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Payment Details</CardTitle>
                        {paymentLink.description && (
                            <CardDescription className="mt-1">
                                {paymentLink.description}
                            </CardDescription>
                        )}
                    </div>
                    <Badge variant="outline" className="ml-4">
                        {paymentLink.chainName}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                            Amount to Pay
                        </p>
                        <p className="text-2xl font-bold">
                            {paymentLink.amount} {paymentLink.tokenSymbol}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            ≈ {formatCurrency(paymentLink.amountUSD)}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                            Payment To
                        </p>
                        <p className="font-medium">
                            {paymentLink.seller.name ||
                                paymentLink.seller.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {paymentLink.seller.email}
                        </p>
                    </div>
                </div>

                <Separator />

                <QRCodeDisplay
                    address={paymentLink.walletAddress}
                    amount={paymentLink.amount}
                    chainId={paymentLink.chainId}
                />
                <MobilePaymentActions
                    walletAddress={paymentLink.walletAddress}
                    amount={paymentLink.amount}
                    tokenSymbol={paymentLink.tokenSymbol}
                    chainId={paymentLink.chainId}
                />

                <CountdownTimer />
            </CardContent>
        </Card>
    );
}

function CompletedPayment() {
    const { paymentLink } = usePayStore();

    if (!paymentLink || paymentLink.status !== "COMPLETED") return null;

    return (
        <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-6">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-green-900">
                            Payment Completed!
                        </h3>
                        <p className="text-green-700 mt-1">
                            Your payment of {paymentLink.amount}{" "}
                            {paymentLink.tokenSymbol} has been successfully
                            processed.
                        </p>
                    </div>
                    <div className="text-sm text-green-600">
                        <p>
                            Transaction completed at{" "}
                            {new Date().toLocaleString()}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function PayPage() {
    const params = useParams();
    const {
        paymentLink,
        loading,
        errors,
        fetchPaymentLink,
        reset,
        clearErrors,
    } = usePayStore();

    const paymentId = params?.id as string;

    useEffect(() => {
        if (paymentId) {
            fetchPaymentLink(paymentId);
        }

        return () => {
            reset();
        };
    }, [paymentId, fetchPaymentLink, reset]);

    if (loading.paymentLink) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="text-muted-foreground">
                        Loading payment details...
                    </p>
                </div>
            </div>
        );
    }

    if (errors.paymentLink) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6">
                        <div className="text-center space-y-4">
                            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
                            <div>
                                <h3 className="text-lg font-semibold">
                                    Payment Not Found
                                </h3>
                                <p className="text-muted-foreground mt-1">
                                    {errors.paymentLink}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={clearErrors}
                                    className="flex-1"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Try Again
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!paymentLink) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-4xl mx-auto px-4 py-8">
                <div className="space-y-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold">
                            Complete Your Payment
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Send cryptocurrency to complete this payment
                        </p>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="space-y-6">
                            <PaymentDetails />
                            <PaymentStatus />
                        </div>

                        <div className="space-y-6">
                            {paymentLink.status === "COMPLETED" ? (
                                <CompletedPayment />
                            ) : (
                                <PaymentInstructions />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
