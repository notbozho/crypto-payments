import React, { useState, useRef, useEffect } from "react";
import { useRegistrationFlowStore } from "@/store/registrationFlow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Mail, Clock, ArrowLeft, RefreshCw } from "lucide-react";

export function VerifyEmailStep() {
    const {
        userData,
        loading,
        error,
        codeExpiresAt,
        resendCooldown,
        verificationAttempts,
        verifyCode,
        resendCode,
        updateEmail,
    } = useRegistrationFlowStore();

    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [timeLeft, setTimeLeft] = useState(0);

    // Update timer
    useEffect(() => {
        if (!codeExpiresAt) return;

        const interval = setInterval(() => {
            const now = new Date();
            const timeRemaining = Math.max(
                0,
                Math.floor((codeExpiresAt.getTime() - now.getTime()) / 1000)
            );
            setTimeLeft(timeRemaining);

            if (timeRemaining === 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [codeExpiresAt]);

    // Auto-focus first input on mount
    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleCodeChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-advance to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits are entered
        if (newCode.every((digit) => digit !== "") && value) {
            handleVerifyCode(newCode.join(""));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        // Handle backspace
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }

        // Handle paste
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
        if (codeToVerify.length !== 6) return;

        const success = await verifyCode(codeToVerify);
        if (!success) {
            // Clear the code on error
            setCode(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        }
    };

    const handleResendCode = async () => {
        const success = await resendCode();
        if (success) {
            setCode(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    const isCodeExpired = timeLeft === 0 && codeExpiresAt;
    const canResend = resendCooldown === 0 && !loading;
    const maxAttemptsReached = verificationAttempts >= 5;

    return (
        <Card>
            <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Check your email</CardTitle>
                <CardDescription>
                    We sent a 6-digit code to{" "}
                    <span className="font-medium text-foreground">
                        {userData?.email}
                    </span>
                </CardDescription>
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
                        Too many incorrect attempts. Please request a new code.
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

                    {/* Timer */}
                    <div className="text-center text-sm text-muted-foreground">
                        {isCodeExpired ? (
                            <span className="text-red-600 flex items-center justify-center gap-1">
                                <Clock className="h-4 w-4" />
                                Code expired
                            </span>
                        ) : timeLeft > 0 ? (
                            <span className="flex items-center justify-center gap-1">
                                <Clock className="h-4 w-4" />
                                Code expires in {formatTime(timeLeft)}
                            </span>
                        ) : null}
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    {/* Resend Code */}
                    <div className="text-center">
                        <Button
                            variant="ghost"
                            onClick={handleResendCode}
                            disabled={!canResend || loading}
                            className="text-sm"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : resendCooldown > 0 ? (
                                `Resend code in ${resendCooldown}s`
                            ) : (
                                "Resend code"
                            )}
                        </Button>
                    </div>

                    {/* Change Email */}
                    <div className="text-center">
                        <Button
                            variant="outline"
                            onClick={() => updateEmail("")}
                            disabled={loading}
                            className="text-sm"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Change email address
                        </Button>
                    </div>
                </div>

                {/* Help Text */}
                <div className="text-center text-xs text-muted-foreground">
                    Check your spam folder if you don&apos;t see the email.
                    <br />
                    The code will expire in 15 minutes.
                </div>
            </CardContent>
        </Card>
    );
}
