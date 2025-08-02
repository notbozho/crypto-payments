import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRegistrationFlowStore } from "@/store/registrationFlow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Shield,
    Smartphone,
    Copy,
    AlertTriangle,
    Eye,
    EyeOff,
    ArrowRight,
} from "lucide-react";

export default function TwoFactorSetupStep() {
    const {
        userData,
        totpSetupData,
        loading,
        error,
        generateTOTPSetup,
        verifyAndEnableTOTP,
        skip2FA,
        setError,
    } = useRegistrationFlowStore();

    const [verificationCode, setVerificationCode] = useState("");
    const [showManualKey, setShowManualKey] = useState(false);

    // Load TOTP setup data on mount
    useEffect(() => {
        if (!totpSetupData) {
            generateTOTPSetup();
        }
    }, [totpSetupData, generateTOTPSetup]);

    const handleVerifyAndEnable = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            setError("Please enter a 6-digit code");
            return;
        }

        setError(null);
        await verifyAndEnableTOTP(verificationCode);
    };

    const handleSkip = () => {
        skip2FA();
        // Store automatically advances to 'complete' step
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
        }
    };

    // Loading state
    if (loading || !totpSetupData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <Shield className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                        <CardTitle className="text-2xl">
                            Setting up 2FA...
                        </CardTitle>
                        <CardDescription>
                            Generating your security codes
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <Shield className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <CardTitle className="text-2xl">
                        Set up Two-Factor Authentication
                    </CardTitle>
                    <CardDescription>
                        Add an extra layer of security to your account
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* QR Code Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5" />
                            <h3 className="font-medium">
                                Step 1: Scan QR Code
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            Use your authenticator app (Google Authenticator,
                            Authy, etc.) to scan this QR code:
                        </p>

                        <div className="flex justify-center p-4 bg-white border rounded-lg">
                            <Image
                                src={totpSetupData.qrCode}
                                alt="2FA QR Code"
                                className="w-48 h-48"
                                width={192}
                                height={192}
                            />
                        </div>

                        <div className="text-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowManualKey(!showManualKey)}
                            >
                                {showManualKey ? (
                                    <>
                                        <EyeOff className="h-4 w-4 mr-2" />
                                        Hide Manual Key
                                    </>
                                ) : (
                                    <>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Can&apos;t scan? Use manual key
                                    </>
                                )}
                            </Button>
                        </div>

                        {showManualKey && (
                            <div className="space-y-2">
                                <Label>Manual Entry Key</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={totpSetupData.manualEntryKey}
                                        readOnly
                                        className="font-mono text-sm"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            copyToClipboard(
                                                totpSetupData.manualEntryKey
                                            )
                                        }
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Enter this key manually in your
                                    authenticator app
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Verification Section */}
                    <div className="space-y-4">
                        <h3 className="font-medium">Step 2: Verify Setup</h3>
                        <p className="text-sm text-gray-600">
                            Enter the 6-digit code from your authenticator app:
                        </p>

                        <div className="space-y-2">
                            <Label htmlFor="verification">
                                Verification Code
                            </Label>
                            <Input
                                id="verification"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                placeholder="000000"
                                value={verificationCode}
                                onChange={(e) =>
                                    setVerificationCode(
                                        e.target.value.replace(/\D/g, "")
                                    )
                                }
                                className="text-center text-lg tracking-widest"
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={handleVerifyAndEnable}
                                disabled={
                                    verificationCode.length !== 6 || loading
                                }
                                className="flex-1"
                            >
                                {loading ? "Verifying..." : "Enable 2FA"}
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>

                        <Button
                            variant="ghost"
                            onClick={handleSkip}
                            className="w-full text-gray-500"
                        >
                            Skip for now
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
