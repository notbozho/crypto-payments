"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    AlertCircle,
    Shield,
    ArrowLeft,
    RefreshCw,
    Smartphone,
} from "lucide-react";

type ActionType =
    | "login"
    | "delete-account"
    | "change-password"
    | "sensitive-action";

interface TwoFARequiredPageProps {
    redirectPath?: string;
    actionContext?: ActionType;
    canGoBack?: boolean;
    onCancel?: () => void;
}

export default function TwoFARequiredPage({
    redirectPath = "/dashboard",
    actionContext = "login",
    canGoBack = true,
    onCancel,
}: TwoFARequiredPageProps) {
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [verificationAttempts, setVerificationAttempts] = useState(0);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const router = useRouter();
    const { user, logout } = useAuthStore();

    // Auto-focus first input on mount
    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleCodeChange = (index: number, value: string) => {
        if (value && !/^\d$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        if (newCode.every((digit) => digit !== "") && value) {
            handleVerifyCode(newCode.join(""));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }

        if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            navigator.clipboard.readText().then((text) => {
                const pastedCode = text.replace(/\D/g, "").slice(0, 6);
                if (pastedCode.length === 6) {
                    const newCode = pastedCode.split("");
                    setCode(newCode);
                    handleVerifyCode(pastedCode);
                }
            });
        }
    };

    const handleVerifyCode = async (codeToVerify: string) => {
        if (codeToVerify.length !== 6 || loading) return;

        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/totp/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token: codeToVerify,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                router.push(redirectPath);
            } else {
                setError(data.error || "Invalid verification code");
                setVerificationAttempts((prev) => prev + 1);

                setCode(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
            }
        } catch (err) {
            setError("Failed to verify code. Please try again.");
            setCode(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            logout();
            router.push("/auth/signin");
        }
    };

    const maxAttemptsReached = verificationAttempts >= 5;

    const getContextDescription = () => {
        switch (actionContext) {
            case "login":
                return "Complete your sign in with two-factor authentication";
            case "delete-account":
                return "Verify your identity to delete your account";
            case "change-password":
                return "Verify your identity to change your password";
            case "sensitive-action":
                return "This action requires two-factor authentication";
            default:
                return "Two-factor authentication required";
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">
                        Two-Factor Authentication
                    </CardTitle>
                    <CardDescription>{getContextDescription()}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Global Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Max Attempts Warning */}
                    {maxAttemptsReached && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm">
                            Too many incorrect attempts. Please try again later
                            or contact support.
                        </div>
                    )}

                    {/* Code Inputs */}
                    <div className="space-y-4">
                        <div className="flex justify-center gap-2">
                            {code.map((digit, index) => (
                                <Input
                                    key={index}
                                    ref={(el) => {
                                        inputRefs.current[index] = el;
                                    }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) =>
                                        handleCodeChange(index, e.target.value)
                                    }
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-12 text-center text-lg font-mono"
                                    disabled={loading || maxAttemptsReached}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Enter the 6-digit code from your authenticator app
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <Button
                            onClick={() => handleVerifyCode(code.join(""))}
                            disabled={
                                loading ||
                                code.join("").length !== 6 ||
                                maxAttemptsReached
                            }
                            className="w-full"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                "Verify Code"
                            )}
                        </Button>

                        {canGoBack && (
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                disabled={loading}
                                className="w-full"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                        )}
                    </div>

                    {/* Help Text */}
                    <div className="text-center text-xs text-muted-foreground">
                        Don&apos;t have access to your authenticator app?
                        <br />
                        <button
                            type="button"
                            className="text-blue-600 hover:underline mt-1"
                            onClick={() => {
                                router.push("/auth/2fa/recovery");
                            }}
                        >
                            Use recovery codes
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
