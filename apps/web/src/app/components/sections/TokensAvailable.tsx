"use client";

import tokens from "@/assets/tokens.png";
import bgCircle from "@/assets/bgCircle.png";
import Image from "next/image";
import { SparklesCore } from "../Sparcles";
import { motion } from "motion/react";
import { TokenIcon } from "@web3icons/react";
import { Button } from "@/components/ui/button";

type TokenProps = {
    symbol: string;
    size: "sm" | "md" | "lg";
};

const Token = ({ symbol, size }: TokenProps) => {
    const sizeMap = {
        sm: 48,
        md: 64,
        lg: 80,
    };

    const pxSize = sizeMap[size];

    return (
        <div
            className="rounded-full bg-gradient-to-t from-background to-blue-500/60 border border-blue-500 flex items-center justify-center"
            style={{ width: pxSize, height: pxSize }}
        >
            <TokenIcon
                symbol={symbol}
                variant="mono"
                size={pxSize / 2}
                color="#c7ebfd"
            />
        </div>
    );
};

export function TokensAvailable() {
    return (
        <section className="py-12">
            <div className="mx-auto">
                <div className="relative container mx-auto">
                    <Image
                        src={bgCircle.src}
                        alt="Background Circle"
                        className="absolute inset-0 -z-10 w-[35rem] left-[calc(50%-17.5rem)] -top-10"
                        width={400}
                        height={300}
                    />
                    <div className="flex w-full justify-between absolute top-[32%] items-center mask-radial py-10">
                        <Token symbol="DAI" size={"sm"} />
                        <Token symbol="USDC" size={"md"} />
                        <Token symbol="USDT" size={"md"} />
                        <Token symbol="BTC" size={"lg"} />
                        {/* // spacer */}
                        <div className="w-20" />
                        <Token symbol="ETH" size={"lg"} />
                        <Token symbol="XRP" size={"md"} />
                        <Token symbol="BNB" size={"md"} />
                        <Token symbol="UNI" size={"sm"} />
                    </div>
                    <Image
                        src={tokens.src}
                        alt="Tokens"
                        className="mx-auto py-20 w-72 object-contain"
                        width={200}
                        height={200}
                    />
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: 1,
                        }}
                        transition={{
                            duration: 0.5,
                        }}
                        className="mask-radial absolute inset-0 h-[700px]"
                    >
                        <SparklesCore
                            background="transparent"
                            minSize={0.5}
                            maxSize={1.3}
                            particleDensity={30}
                            speed={1}
                        />
                    </motion.div>
                </div>
                {/* Text */}
                <div className="flex flex-col gap-6 items-center">
                    <h1 className="text-4xl font-semibold leading-tight">
                        More than 100{" "}
                        <span className="text-primary">tokens</span> available
                    </h1>
                    <p className="font-light text-zinc-300">
                        Explore a wide variety of tokens. Receive payments in
                        your favorite cryptocurrencies.
                    </p>
                    <Button variant="outline" size={"lg"}>
                        Explore Tokens
                    </Button>
                </div>
            </div>
        </section>
    );
}
