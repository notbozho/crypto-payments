import React from "react";
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
import { Wallet, ArrowRight, Info } from "lucide-react";

export default function WalletConnectionStep() {
    const { userData, loading, error, connectWallet, skipWallet, setError } =
        useRegistrationFlowStore();

    const handleConnectWallet = async () => {
        // TODO: Implement actual wallet connection logic
        // For now, just simulate a connection
        setError(null);

        // Placeholder wallet data
        const mockWalletData = {
            address: "0x1234567890123456789012345678901234567890",
            type: "metamask",
        };

        connectWallet(mockWalletData);
    };

    const handleSkip = () => {
        setError(null);
        skipWallet();
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <Wallet className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
                <CardDescription>
                    Connect a wallet to easily manage your payments
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Info about wallet connection */}
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Optional:</strong> You can connect a wallet now
                        for easier withdrawals, or add one later in your
                        settings.
                    </AlertDescription>
                </Alert>

                {/* Wallet connection options */}
                <div className="space-y-4">
                    <h3 className="font-medium text-center">
                        Choose a wallet to connect
                    </h3>

                    {/* Placeholder wallet options */}
                    <div className="space-y-3">
                        <Button
                            onClick={handleConnectWallet}
                            disabled={loading}
                            variant="outline"
                            className="w-full h-12 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Wallet className="h-5 w-5 text-orange-600" />
                                </div>
                                <span>MetaMask</span>
                            </div>
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            ) : (
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                            )}
                        </Button>

                        <Button
                            onClick={() =>
                                setError("WalletConnect coming soon!")
                            }
                            variant="outline"
                            className="w-full h-12 flex items-center justify-between opacity-50 cursor-not-allowed"
                            disabled
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Wallet className="h-5 w-5 text-blue-600" />
                                </div>
                                <span>WalletConnect</span>
                            </div>
                            <span className="text-xs text-gray-400">Soon</span>
                        </Button>

                        <Button
                            onClick={() =>
                                setError("Coinbase Wallet coming soon!")
                            }
                            variant="outline"
                            className="w-full h-12 flex items-center justify-between opacity-50 cursor-not-allowed"
                            disabled
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <Wallet className="h-5 w-5 text-indigo-600" />
                                </div>
                                <span>Coinbase Wallet</span>
                            </div>
                            <span className="text-xs text-gray-400">Soon</span>
                        </Button>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                    <Button
                        onClick={handleSkip}
                        variant="ghost"
                        className="w-full"
                    >
                        Skip for now
                    </Button>

                    <p className="text-xs text-center text-gray-500">
                        You can always connect a wallet later in your account
                        settings
                    </p>
                </div>

                {/* User info */}
                {userData?.email && (
                    <div className="pt-4 border-t">
                        <p className="text-xs text-center text-gray-500">
                            Setting up account for{" "}
                            <strong>{userData.email}</strong>
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
