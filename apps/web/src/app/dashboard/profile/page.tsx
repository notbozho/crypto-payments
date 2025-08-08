"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth";
import { useDashboardStore } from "@/store/dashboard";
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
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
    const { user } = useAuthStore();
    const { updateSellerWallet, loading } = useDashboardStore();
    const [walletAddress, setWalletAddress] = useState("");

    const handleUpdateWallet = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!walletAddress) return;

        try {
            await updateSellerWallet(walletAddress);
            setWalletAddress("");
        } catch (error) {
            // Error is handled in the store
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Profile Settings
                </h1>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                        <CardDescription>
                            Your basic account details
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input value={user?.email || ""} disabled />
                        </div>
                        <div className="grid gap-2">
                            <Label>Name</Label>
                            <Input value={user?.name || ""} disabled />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Wallet Settings</CardTitle>
                        <CardDescription>
                            Set your wallet address to receive payments
                            (Payments will be forwarded here)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={handleUpdateWallet}
                            className="space-y-4"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="walletAddress">
                                    Wallet Address
                                </Label>
                                <Input
                                    id="walletAddress"
                                    placeholder="0x..."
                                    value={walletAddress}
                                    onChange={(e) =>
                                        setWalletAddress(e.target.value)
                                    }
                                    pattern="^0x[a-fA-F0-9]{40}$"
                                    title="Please enter a valid Ethereum address"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={
                                    loading.updateWallet || !walletAddress
                                }
                            >
                                {loading.updateWallet && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Update Wallet Address
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
