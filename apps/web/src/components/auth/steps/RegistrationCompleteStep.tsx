import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRegistrationFlowStore } from "@/store/registrationFlow";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle,
    ArrowRight,
    Mail,
    Wallet,
    Shield,
    User,
} from "lucide-react";

export default function RegistrationCompleteStep() {
    const router = useRouter();
    const { userData, walletData, has2FA, skipped2FA, reset } =
        useRegistrationFlowStore();

    const handleGoToDashboard = async () => {
        reset();

        router.push("/dashboard");
    };

    const completedFeatures = [
        {
            icon: <User className="h-5 w-5" />,
            title: "Account Created",
            description: `Welcome, ${userData?.name || "there"}!`,
            completed: true,
        },
        {
            icon: <Mail className="h-5 w-5" />,
            title: "Email Verified",
            description: userData?.email || "Email confirmed",
            completed: true,
        },
        {
            icon: <Wallet className="h-5 w-5" />,
            title: "Wallet Connected",
            description: walletData?.address
                ? `${walletData.address.slice(
                      0,
                      6
                  )}...${walletData.address.slice(-4)}`
                : "Skipped for now",
            completed: !!walletData?.address,
        },
        {
            icon: <Shield className="h-5 w-5" />,
            title: "Two-Factor Authentication",
            description: has2FA
                ? "2FA enabled with backup codes"
                : "Skipped for now",
            completed: has2FA,
        },
    ];

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-900">
                    You&apos;re All Set!
                </CardTitle>
                <CardDescription>
                    Your CryptoPay account is ready to use
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Setup Summary */}
                <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Setup Summary</h3>
                    <div className="space-y-3">
                        {completedFeatures.map((feature, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                            >
                                <div
                                    className={`rounded-full p-1 ${
                                        feature.completed
                                            ? "bg-green-100 text-green-600"
                                            : "bg-gray-100 text-gray-400"
                                    }`}
                                >
                                    {feature.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm text-gray-900">
                                            {feature.title}
                                        </p>
                                        {feature.completed ? (
                                            <Badge
                                                variant="default"
                                                className="text-xs bg-green-100 text-green-800"
                                            >
                                                ✓ Done
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                Skipped
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-600 truncate">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Next Steps */}
                <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">
                        What&apos;s Next?
                    </h3>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-blue-900">
                                Start accepting crypto payments
                            </p>
                            <ul className="text-xs text-blue-800 space-y-1">
                                <li>• Create your first payment link</li>
                                <li>• Set up your withdrawal wallet</li>
                                <li>• Customize your payment pages</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <Button
                    onClick={handleGoToDashboard}
                    size="lg"
                    className="w-full"
                >
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                <p className="text-xs text-center text-gray-500">
                    Welcome to CryptoPay! Let&apos;s start building your payment
                    business.
                </p>
            </CardContent>
        </Card>
    );
}
