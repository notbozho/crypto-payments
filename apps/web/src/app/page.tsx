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
import { TokensAvailable } from "./components/sections/TokensAvailable";
import { MeshGradient } from "@paper-design/shaders-react";
import { Navbar } from "./components/Header";
import { Testimonials } from "./components/sections/Testimonials";

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
            <Navbar />

            {/* Hero Section */}
            <main className="mx-auto p-0 sm:p-3 lg:p-5">
                <div className="relative min-h-screen flex items-center justify-center rounded-0 rounded-br-4xl rounded-bl-4xl md:rounded-4xl p-8 sm:p-12 lg:p-16 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 -z-10 rounded-4xl"
                    >
                        {/* SVG Filters */}
                        <svg className="absolute inset-0 w-0 h-0">
                            <defs>
                                <filter
                                    id="glass-effect"
                                    x="-50%"
                                    y="-50%"
                                    width="200%"
                                    height="200%"
                                >
                                    <feTurbulence
                                        baseFrequency="0.005"
                                        numOctaves="1"
                                        result="noise"
                                    />
                                    <feDisplacementMap
                                        in="SourceGraphic"
                                        in2="noise"
                                        scale="0.3"
                                    />
                                    <feColorMatrix
                                        type="matrix"
                                        values="1 0 0 0 0.02
                      0 1 0 0 0.02
                      0 0 1 0 0.05
                      0 0 0 0.9 0"
                                        result="tint"
                                    />
                                </filter>
                                <filter
                                    id="gooey-filter"
                                    x="-50%"
                                    y="-50%"
                                    width="200%"
                                    height="200%"
                                >
                                    <feGaussianBlur
                                        in="SourceGraphic"
                                        stdDeviation="4"
                                        result="blur"
                                    />
                                    <feColorMatrix
                                        in="blur"
                                        mode="matrix"
                                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                                        result="gooey"
                                    />
                                    <feComposite
                                        in="SourceGraphic"
                                        in2="gooey"
                                        operator="atop"
                                    />
                                </filter>
                            </defs>
                        </svg>

                        {/* Background Shaders */}
                        <MeshGradient
                            className="absolute inset-0 w-full h-full"
                            colors={[
                                "#020d16",
                                "#030d16",
                                "#1b2554",
                                "#27398b",
                            ]}
                            speed={1}
                        />
                        <MeshGradient
                            className="absolute inset-0 w-full h-full opacity-60"
                            colors={[
                                "#020d16",
                                // "#4ee8f5",
                                "#27398b",
                                "#1b2554",
                            ]}
                            speed={0.2}
                        />
                    </motion.div>
                    <div className="text-center space-y-2 md:space-y-8">
                        <div className="border-primary/50 bg-card/50 mb-4 inline-flex items-center gap-2 rounded-full border px-5 py-1.5 md:py-2 shadow-blue-600 shadow-[0_0px_16px_rgba(255,255,255,0.2)] md:shadow-[0_0px_20px_rgba(255,255,255,0.2)] backdrop-blur-sm md:mb-8">
                            <span className="text-foreground text-sm font-light tracking-normal md:tracking-wide md:text-base">
                                Built for speed and simplicity
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-6xl lg:text-7xl leading-tight bg-gradient-to-b font-bold from-white to-blue-200 bg-clip-text text-transparent container mx-auto">
                            Accepting Crypto <br /> Payments Effortlessly
                        </h1>

                        <p className="text-sm sm:text-base md:text-lg text-pretty text-blue-100/80 max-w-4xl mx-auto leading-loose">
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
                                duration: 8,
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

            {/* Tokens Available */}
            <TokensAvailable />

            {/* Testimonials */}
            <Testimonials />
        </div>
    );
}
