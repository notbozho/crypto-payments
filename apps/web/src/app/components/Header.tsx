"use client";

import { Button } from "@/components/ui/button";
import { Bitcoin } from "lucide-react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { useState } from "react";

export function Navbar() {
    const { scrollY } = useScroll();
    const [isScrolled, setIsScrolled] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 250);
    });

    return (
        <motion.header
            animate={{
                paddingTop: isScrolled ? "1.5rem" : "3rem",
                paddingBottom: isScrolled ? "1.5rem" : "3rem",
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed top-0 p-2 left-1/2 transform -translate-x-1/2 z-10 w-full mx-auto md:px-20 py-12"
        >
            <div
                className={`absolute inset-0 -z-10 transition-all duration-300 bg-background/80 mask-to-t ${
                    isScrolled
                        ? "backdrop-blur-3xl"
                        : "backdrop-blur-0 bg-transparent"
                }`}
            />
            <nav className="flex justify-between items-center">
                <div className="text-2xl font-medium text-blue-100 flex gap-1 md:gap-2 items-center">
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
        </motion.header>
    );
}
