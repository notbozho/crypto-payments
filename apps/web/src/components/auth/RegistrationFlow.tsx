"use client";

import React, { useEffect } from "react";
import { useRegistrationFlowStore } from "@/store/registrationFlow";
import { Progress } from "@/components/ui/progress";
import { GalleryVerticalEnd } from "lucide-react";
import { RegisterStep } from "./steps/RegisterStep";
import { VerifyEmailStep } from "./steps/VerifyEmailStep";

const STEP_LABELS = {
    register: "Create Account",
    "verify-email": "Verify Email",
    "connect-wallet": "Connect Wallet",
    "2fa-setup": "Security Setup",
    complete: "Complete",
};

const STEP_PROGRESS = {
    register: 20,
    "verify-email": 40,
    "connect-wallet": 60,
    "2fa-setup": 80,
    complete: 100,
};

export function RegistrationFlow() {
    const { currentStep, reset } = useRegistrationFlowStore();

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Don't reset if user is just navigating around
            // reset();
        };
    }, []);

    const renderStep = () => {
        switch (currentStep) {
            case "register":
                return <RegisterStep />;
            case "verify-email":
                return <VerifyEmailStep />;
            case "connect-wallet":
                return <div>Connect Wallet Step (Coming soon)</div>;
            case "2fa-setup":
                return <div>2FA Setup Step (Coming soon)</div>;
            case "complete":
                return <div>Complete Step (Coming soon)</div>;
            default:
                return <RegisterStep />;
        }
    };

    return (
        <div className="min-h-screen bg-muted flex flex-col items-center justify-center gap-6 p-6">
            <div className="w-full max-w-sm flex flex-col gap-6">
                {/* Logo */}
                <div className="flex items-center gap-2 self-center font-medium">
                    <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                        <GalleryVerticalEnd className="size-4" />
                    </div>
                    CryptoPay
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{STEP_LABELS[currentStep]}</span>
                        <span>
                            Step{" "}
                            {Object.keys(STEP_LABELS).indexOf(currentStep) + 1}{" "}
                            of {Object.keys(STEP_LABELS).length}
                        </span>
                    </div>
                    <Progress
                        value={STEP_PROGRESS[currentStep]}
                        className="h-2"
                    />
                </div>

                {/* Step Content */}
                <div className="transition-all duration-300 ease-in-out">
                    {renderStep()}
                </div>

                {/* Debug info (remove in production) */}
                {process.env.NODE_ENV === "development" && (
                    <div className="text-xs text-muted-foreground text-center">
                        Current step: {currentStep}
                    </div>
                )}
            </div>
        </div>
    );
}
