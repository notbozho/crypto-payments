"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bitcoin } from "lucide-react";
import Image from "next/image";

import capsule from "@/assets/partners/capsule.png";
import command from "@/assets/partners/command.png";
import hourglass from "@/assets/partners/hourglass.png";
import layers from "@/assets/partners/layers.png";
import quotient from "@/assets/partners/quotient.png";
import sisyphus from "@/assets/partners/sisyphus.png";

import { motion } from "motion/react";
import { Features } from "./components/sections/Features";

const partners = [
    capsule,
    command,
    hourglass,
    layers,
    quotient,
    sisyphus,
    capsule,
    command,
    hourglass,
    layers,
    quotient,
    sisyphus,
];

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
            <main className="mx-auto p-0 sm:p-3 lg:p-5">
                <div className="relative min-h-screen flex items-center justify-center rounded-0 rounded-br-4xl rounded-bl-4xl md:rounded-4xl p-8 sm:p-12 lg:p-16 overflow-hidden">
                    <div className="absolute inset-0 -z-10 rounded-4xl">
                        <div className="w-full h-full noise hero-bg"></div>
                    </div>
                    <div className="text-center space-y-2 md:space-y-8">
                        <div className="border-primary/50 bg-card/50 mb-4 inline-flex items-center gap-2 rounded-full border px-5 py-1.5 md:py-2 shadow-sky-600 shadow-[0_0px_16px_rgba(255,255,255,0.2)] md:shadow-[0_0px_20px_rgba(255,255,255,0.2)] backdrop-blur-sm md:mb-8">
                            <span className="text-foreground text-sm font-light tracking-normal md:tracking-wide md:text-base">
                                Built for speed and simplicity
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-6xl lg:text-7xl leading-tight bg-gradient-to-b font-bold from-white to-sky-200 bg-clip-text text-transparent container mx-auto">
                            Accepting Crypto <br /> Payments Effortlessly
                        </h1>

                        <p className="text-sm sm:text-base md:text-lg text-pretty text-sky-100/80 max-w-4xl mx-auto leading-loose">
                            Create payment links, receive crypto payments, and
                            get 99% forwarded to your wallet. Built for the
                            modern web with multi-chain support.
                        </p>

                        <div className="space-y-4 md:space-x-4 pt-4 sm:pt-0">
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
            <section className="py-8 md:py-12">
                <div className="flex justify-center">
                    <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black,transparent)] container">
                        <motion.div
                            className="flex justify-center flex-none gap-28 pr-28"
                            animate={{
                                translateX: "-50%",
                            }}
                            transition={{
                                duration: 5,
                                ease: "linear",
                                repeat: Infinity,
                                repeatType: "loop",
                            }}
                        >
                            {partners.map((partner, i) => (
                                <Image
                                    key={i}
                                    src={partner.src}
                                    alt={partner.src}
                                    width={150}
                                    height={150}
                                    className="h-12 w-auto"
                                />
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <Features />
        </div>
    );
}
