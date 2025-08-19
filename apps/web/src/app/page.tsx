import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bitcoin } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="">
            {/* Header */}
            <header className="fixed top-0 p-2 left-1/2 transform -translate-x-1/2 z-10 w-full mx-auto md:px-20 md:py-12">
                <nav className="flex justify-between items-center">
                    <div className="text-2xl font-medium text-sky-100 flex gap-1 md:gap-2 items-center">
                        <Bitcoin size={28} />
                        <div className="hidden md:block">CryptoPay</div>
                    </div>
                    <div className="space-x-2 md:space-x-4">
                        <Button variant="ghost" asChild>
                            <Link href="/auth/signin">Sign In</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/auth/signup">Get Started</Link>
                        </Button>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <main className="mx-auto p-0 sm:p-3 lg:p-6">
                <div className="relative min-h-screen flex items-center justify-center rounded-0 rounded-br-3xl rounded-bl-3xl md:rounded-3xl p-8 sm:p-12 lg:p-16 overflow-hidden">
                    <div className="absolute inset-0 -z-10 rounded-3xl">
                        <div className="w-full h-full noise hero-bg"></div>
                    </div>
                    <div className="text-center space-y-8 ">
                        <div className="border-primary/50 bg-card/50 mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 shadow-sky-700 shadow-[0_0px_24px_rgba(255,255,255,0.2)] backdrop-blur-sm md:mb-10">
                            <span className="text-foreground text-sm tracking-wide">
                                Built for speed and simplicity
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl md:text-7xl bg-gradient-to-b font-bold from-white to-sky-200 bg-clip-text text-transparent max-w-4xl mx-auto">
                            Accepting Crypto <br /> Payments Effortlessly
                        </h1>

                        <p className="text-sm sm:text-base md:text-xl text-sky-100/80 max-w-4xl mx-auto leading-loose">
                            Create payment links, receive crypto payments, and
                            get 99% forwarded to your wallet. Built for the
                            modern web with multi-chain support.
                        </p>

                        <div className="space-y-4 md:space-x-4">
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
                </div>
            </main>

            {/* Partners Section */}
            <section className="py-12">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {/* Partner logos */}
                    </div>
                </div>
            </section>
        </div>
    );
}
