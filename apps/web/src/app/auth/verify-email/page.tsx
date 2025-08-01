"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
    const [status, setStatus] = useState<"loading" | "success" | "error">(
        "loading"
    );
    const [message, setMessage] = useState("");
    const searchParams = useSearchParams();
    const router = useRouter();
    const { verifyEmail } = useAuthStore();

    useEffect(() => {
        const token = searchParams.get("token");

        if (!token) {
            setStatus("error");
            setMessage("Invalid verification link");
            return;
        }

        handleVerification(token);
    }, [searchParams]);

    const handleVerification = async (token: string) => {
        const result = await verifyEmail(token);

        if (result.success) {
            setStatus("success");
            setMessage(result.message);

            // Redirect to signin after 3 seconds
            setTimeout(() => {
                router.push("/auth/signin?verified=true");
            }, 3000);
        } else {
            setStatus("error");
            setMessage(result.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">
                        Email Verification
                    </CardTitle>
                    <CardDescription>
                        Verifying your email address...
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    {status === "loading" && (
                        <div className="space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                            <p className="text-gray-600">
                                Verifying your email...
                            </p>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="space-y-4">
                            <CheckCircle className="h-8 w-8 mx-auto text-green-600" />
                            <div>
                                <p className="text-green-700 font-medium">
                                    Email verified successfully!
                                </p>
                                <p className="text-sm text-gray-600 mt-2">
                                    {message}
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Redirecting to sign in...
                                </p>
                            </div>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="space-y-4">
                            <XCircle className="h-8 w-8 mx-auto text-red-600" />
                            <div>
                                <p className="text-red-700 font-medium">
                                    Verification failed
                                </p>
                                <p className="text-sm text-gray-600 mt-2">
                                    {message}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Button asChild className="w-full">
                                    <Link href="/auth/signin">
                                        Go to Sign In
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    asChild
                                    className="w-full"
                                >
                                    <Link href="/auth/resend-verification">
                                        Resend Verification
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            }
        >
            <VerifyEmailContent />
        </Suspense>
    );
}
