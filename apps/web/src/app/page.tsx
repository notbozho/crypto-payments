import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            {/* Header */}
            <header className="container mx-auto px-4 py-6">
                <nav className="flex justify-between items-center">
                    <div className="text-2xl font-bold text-gray-900">
                        CryptoPay
                    </div>
                    <div className="space-x-4">
                        <Button variant="ghost" asChild>
                            <Link href="/auth/signin">Sign In</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/auth/signup">Get Started</Link>
                        </Button>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <main className="container mx-auto px-4 py-20">
                <div className="text-center space-y-8">
                    <h1 className="text-5xl font-bold text-gray-900 max-w-4xl mx-auto">
                        Accept Crypto Payments
                        <span className="text-blue-600"> Effortlessly</span>
                    </h1>

                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Create payment links, receive crypto payments, and get
                        99% forwarded to your wallet. Built for the modern web
                        with multi-chain support.
                    </p>

                    <div className="space-x-4">
                        <Button size="lg" asChild>
                            <Link href="/auth/signup">
                                Start Accepting Payments
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg">
                            View Demo
                        </Button>
                    </div>
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-8 mt-20">
                    <Card>
                        <CardHeader>
                            <CardTitle>⚡ Instant Setup</CardTitle>
                            <CardDescription>
                                Create payment links in seconds. No complex
                                integration required.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600">
                                Generate unique payment addresses with our HD
                                wallet system. Each payment gets its own secure
                                wallet.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>🔗 Multi-Chain Support</CardTitle>
                            <CardDescription>
                                Accept payments on Ethereum, Polygon, and more
                                networks.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600">
                                Support for USDC, USDT, DAI, and native tokens
                                across multiple blockchain networks.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>💰 Low fees</CardTitle>
                            <CardDescription>
                                We keep only 0.5% - you get the rest forwarded
                                automatically.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600">
                                Automatic forwarding to your wallet once payment
                                is confirmed. Transparent, low fees.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
