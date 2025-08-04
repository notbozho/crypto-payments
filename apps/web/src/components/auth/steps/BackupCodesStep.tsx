import React, { useState } from "react";
import { useRegistrationFlowStore } from "@/store/registrationFlow";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    KeyRound,
    Copy,
    Download,
    AlertTriangle,
    ArrowRight,
    CheckCircle,
    ArrowLeft,
} from "lucide-react";
import { copyToClipboard } from "@/lib/utils";

export default function BackupCodesStep() {
    const {
        totpSetupData,
        userData,
        downloadedBackupCodes,
        goToNextStep,
        goToPreviousStep,
        setDownloadedBackupCodes,
    } = useRegistrationFlowStore();

    const downloadBackupCodes = () => {
        if (!totpSetupData) return;

        const content = [
            "CryptoPay 2FA Backup Codes",
            "============================",
            "",
            `Account: ${userData?.email}`,
            `Generated: ${new Date().toLocaleDateString()}`,
            "",
            "IMPORTANT: Keep these backup codes safe!",
            "Each code can only be used once.",
            "If you lose access to your authenticator app, you can use these codes to log in.",
            "",
            "Your backup codes:",
            ...totpSetupData.backupCodes.map(
                (code, index) => `${index + 1}. ${code}`
            ),
            "",
            "Security reminders:",
            "- Store these codes in a secure location",
            "- Each code can only be used once",
            "- Generate new codes if you run low",
            "- Never share these codes with anyone",
            "",
            "If you lose these codes and your authenticator device,",
            "you will not be able to access your account.",
        ].join("\n");

        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cryptopay-backup-codes-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setDownloadedBackupCodes(true);
    };

    if (!totpSetupData) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <AlertTriangle className="h-8 w-8 mx-auto text-red-600 mb-2" />
                    <CardTitle className="text-2xl">Error</CardTitle>
                    <CardDescription>
                        Backup codes not found. Please try again.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <div className="flex items-center justify-between mb-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => goToPreviousStep()}
                        className="p-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <KeyRound className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <div className="w-10" />
                </div>
                <CardTitle className="text-2xl">
                    Save Your Backup Codes
                </CardTitle>
                <CardDescription>
                    These codes will help you access your account if you lose
                    your device
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Alert
                    variant="destructive"
                    className="border-red-200 bg-red-50"
                >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Critical:</strong> These backup codes are your
                        only way to access your account if you lose your
                        authenticator device. Save them in a secure location
                        now!
                    </AlertDescription>
                </Alert>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium">Your Backup Codes</h3>
                        <Badge variant="secondary" className="text-xs">
                            {totpSetupData.backupCodes.length} codes
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg border">
                        {totpSetupData.backupCodes.map((code, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-center"
                            >
                                <Badge
                                    variant="outline"
                                    className="font-mono text-sm w-full justify-center py-2"
                                >
                                    {code}
                                </Badge>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            onClick={downloadBackupCodes}
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Download
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() =>
                                copyToClipboard(
                                    totpSetupData.backupCodes.join("\n")
                                )
                            }
                            className="flex items-center gap-2"
                        >
                            <Copy className="h-4 w-4" />
                            Copy All
                        </Button>
                    </div>

                    {downloadedBackupCodes && (
                        <Alert className="border-green-200 bg-green-50">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                Great! You&apos;ve downloaded your backup codes.
                                Keep them safe!
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-3">
                        <Button
                            onClick={() => goToNextStep()}
                            disabled={!downloadedBackupCodes}
                            className="w-full"
                            size="lg"
                        >
                            {downloadedBackupCodes ? (
                                <>
                                    Continue
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </>
                            ) : (
                                "Download your codes first"
                            )}
                        </Button>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1">
                        <p>
                            <strong>Security tips:</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Store codes in a password manager</li>
                            <li>Keep a printed copy in a safe place</li>
                            <li>Never share these codes with anyone</li>
                            <li>Each code works only once</li>
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
