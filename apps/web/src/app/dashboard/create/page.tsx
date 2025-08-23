/* eslint-disable @typescript-eslint/no-explicit-any */
// app/dashboard/create/page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Loader2,
    DollarSign,
    Link as LinkIcon,
    Settings,
    CheckCircle,
    Copy,
    ExternalLink,
    AlertCircle,
    RefreshCw,
} from "lucide-react";

import { useCreatePaymentStore } from "@/store/create-payment";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { copyToClipboard } from "@/lib/utils";

function ChainSelector() {
    const {
        formData,
        availableChains,
        loading,
        errors,
        setChain,
        fetchChains,
    } = useCreatePaymentStore();

    useEffect(() => {
        if (availableChains.length === 0 && !loading.chains) {
            fetchChains();
        }
    }, [availableChains.length, loading.chains, fetchChains]);

    if (loading.chains) {
        return (
            <div className="space-y-2">
                <Label>Blockchain</Label>
                <div className="flex items-center justify-center h-10 border border-input bg-background rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                </div>
            </div>
        );
    }

    if (errors.chains) {
        return (
            <div className="space-y-2">
                <Label>Blockchain</Label>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                        <span>{errors.chains}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchChains}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <Label htmlFor="chain">Blockchain *</Label>
            <Select
                value={formData.chainId?.toString()}
                onValueChange={(value) => setChain(parseInt(value))}
            >
                <SelectTrigger
                    className={errors.form.chainId ? "border-destructive" : ""}
                >
                    <SelectValue placeholder="Select blockchain" />
                </SelectTrigger>
                <SelectContent>
                    {availableChains.map((chain) => (
                        <SelectItem key={chain.id} value={chain.id.toString()}>
                            <div className="flex items-center gap-2">
                                <span>{chain.name}</span>
                                <Badge variant="outline" className="text-xs">
                                    {chain.symbol}
                                </Badge>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {errors.form.chainId && (
                <p className="text-sm text-destructive">
                    {errors.form.chainId}
                </p>
            )}
        </div>
    );
}

function TokenSelector() {
    const { formData, availableTokens, setToken, errors } =
        useCreatePaymentStore();

    if (!formData.chainId || availableTokens.length === 0) {
        return (
            <div className="space-y-2">
                <Label>Token</Label>
                <div className="flex items-center justify-center h-10 border border-input bg-muted/50 rounded-md text-sm text-muted-foreground">
                    Select a blockchain first
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <Label htmlFor="token">Token *</Label>
            <Select value={formData.tokenAddress} onValueChange={setToken}>
                <SelectTrigger>
                    <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                    {availableTokens.map((token) => (
                        <SelectItem key={token.address} value={token.address}>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">
                                    {token.symbol}
                                </span>
                                <span className="text-muted-foreground">
                                    {token.name}
                                </span>
                                {token.isNative && (
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        Native
                                    </Badge>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function SwapSettings() {
    const { formData, availableStablecoins, setFormData, errors } =
        useCreatePaymentStore();

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label>Auto-swap to Stablecoin</Label>
                    <p className="text-sm text-muted-foreground">
                        Automatically swap received tokens to a stablecoin
                    </p>
                </div>
                <Switch
                    checked={formData.swapToStable}
                    onCheckedChange={(checked: any) =>
                        setFormData("swapToStable", checked)
                    }
                />
            </div>

            {formData.swapToStable && (
                <>
                    <div className="space-y-2">
                        <Label>Target Stablecoin</Label>
                        <Select
                            value={formData.stablecoinAddress}
                            onValueChange={(value) =>
                                setFormData("stablecoinAddress", value)
                            }
                            disabled={availableStablecoins.length === 0}
                        >
                            <SelectTrigger
                                className={
                                    errors.form.stablecoinAddress
                                        ? "border-destructive"
                                        : ""
                                }
                            >
                                <SelectValue placeholder="Select stablecoin" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableStablecoins.map((token) => (
                                    <SelectItem
                                        key={token.address}
                                        value={token.address}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                {token.symbol}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {token.name}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.form.stablecoinAddress && (
                            <p className="text-sm text-destructive">
                                {errors.form.stablecoinAddress}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slippage">Slippage Tolerance (%)</Label>
                        <Input
                            id="slippage"
                            type="number"
                            min="0.1"
                            max="50"
                            step="0.1"
                            value={formData.slippageTolerance}
                            onChange={(e) =>
                                setFormData(
                                    "slippageTolerance",
                                    parseFloat(e.target.value)
                                )
                            }
                            placeholder="5.0"
                        />
                    </div>
                </>
            )}
        </div>
    );
}

function PaymentForm() {
    const {
        formData,
        setFormData,
        errors,
        loading,
        createPaymentLink,
        validateForm,
    } = useCreatePaymentStore();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createPaymentLink();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <ChainSelector />
                <TokenSelector />
            </div>

            <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD) *</Label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="amount"
                        type="number"
                        min="1"
                        max="1000000"
                        step="0.01"
                        value={formData.amountUSD}
                        onChange={(e) =>
                            setFormData("amountUSD", e.target.value)
                        }
                        placeholder="100.00"
                        className={`pl-9 ${
                            errors.form.amountUSD ? "border-destructive" : ""
                        }`}
                    />
                </div>
                {errors.form.amountUSD && (
                    <p className="text-sm text-destructive">
                        {errors.form.amountUSD}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e: any) =>
                        setFormData("description", e.target.value)
                    }
                    placeholder="Payment for services..."
                    maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                    {formData.description.length}/500 characters
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Expiry Time</Label>
                    <Select
                        value={formData.expiryOption}
                        onValueChange={(value: any) =>
                            setFormData("expiryOption", value)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1_hour">1 Hour</SelectItem>
                            <SelectItem value="3_days">3 Days</SelectItem>
                            <SelectItem value="7_days">7 Days</SelectItem>
                            <SelectItem value="30_days">30 Days</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {formData.expiryOption === "custom" && (
                    <div className="space-y-2">
                        <Label htmlFor="customExpiry">Custom Expiry Date</Label>
                        <Input
                            id="customExpiry"
                            type="datetime-local"
                            value={formData.customExpiryDate}
                            onChange={(e) =>
                                setFormData("customExpiryDate", e.target.value)
                            }
                            min={new Date().toISOString().slice(0, 16)}
                            className={
                                errors.form.customExpiryDate
                                    ? "border-destructive"
                                    : ""
                            }
                        />
                        {errors.form.customExpiryDate && (
                            <p className="text-sm text-destructive">
                                {errors.form.customExpiryDate}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <Separator />

            <SwapSettings />

            <div className="space-y-2">
                <Label htmlFor="confirmations">Minimum Confirmations</Label>
                <Select
                    value={formData.minimumConfirmations.toString()}
                    onValueChange={(value) =>
                        setFormData("minimumConfirmations", parseInt(value))
                    }
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">1 Confirmation (Fast)</SelectItem>
                        <SelectItem value="3">
                            3 Confirmations (Balanced)
                        </SelectItem>
                        <SelectItem value="6">
                            6 Confirmations (Safe)
                        </SelectItem>
                        <SelectItem value="12">
                            12 Confirmations (Very Safe)
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {errors.create && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.create}</AlertDescription>
                </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading.create}>
                {loading.create ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Payment Link...
                    </>
                ) : (
                    <>
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Create Payment Link
                    </>
                )}
            </Button>
        </form>
    );
}

function SuccessCard() {
    const { createdPaymentLink, reset } = useCreatePaymentStore();
    const router = useRouter();

    if (!createdPaymentLink) return null;

    const paymentUrl = `${window.location.origin}/pay/${createdPaymentLink.id}`;

    return (
        <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-green-900">
                        Payment Link Created!
                    </CardTitle>
                </div>
                <CardDescription className="text-green-700">
                    Your payment link is ready to be shared
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Payment Link</Label>
                    <div className="flex gap-2">
                        <Input
                            value={paymentUrl}
                            readOnly
                            className="font-mono text-sm"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(paymentUrl)}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(paymentUrl, "_blank")}
                        >
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-muted-foreground">Amount:</span>
                        <p className="font-medium">
                            ${createdPaymentLink.amountUSD}
                        </p>
                    </div>
                    <div>
                        <span className="text-muted-foreground">
                            Blockchain:
                        </span>
                        <p className="font-medium">
                            {createdPaymentLink.chain?.name}
                        </p>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Wallet:</span>
                        <p className="font-mono text-xs">
                            {createdPaymentLink.walletAddress}
                        </p>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Expires:</span>
                        <p className="text-xs">
                            {new Date(
                                createdPaymentLink.expiresAt
                            ).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            reset();
                            router.push("/dashboard");
                        }}
                        className="flex-1"
                    >
                        View Dashboard
                    </Button>
                    <Button onClick={reset} className="flex-1">
                        Create Another
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function CreatePaymentPage() {
    const { createdPaymentLink, fetchChains } = useCreatePaymentStore();
    const authStatus = useAuthStore((s) => s.authStatus);
    const loading = useAuthStore((s) => s.loading);
    const router = useRouter();

    useEffect(() => {
        if (authStatus === "authenticated" && !loading) {
            fetchChains();
        }
    }, [authStatus, loading, fetchChains]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push("/dashboard")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Create Payment Link</h1>
                    <p className="text-muted-foreground">
                        Generate a secure payment link for your customers
                    </p>
                </div>
            </div>

            {createdPaymentLink ? (
                <SuccessCard />
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Payment Configuration
                        </CardTitle>
                        <CardDescription>
                            Configure your payment link settings and preferences
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PaymentForm />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
