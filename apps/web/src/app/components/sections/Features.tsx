import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import Link from "next/link";

const SmartNotifications = () => {
    return (
        <motion.div
            variants={{
                rest: { opacity: 0.7, y: 0 },
                hover: {
                    opacity: 1,
                    y: -10,
                },
            }}
            transition={{
                type: "spring",
            }}
            className="bg-background/10  backdrop-blur-xl rounded-xl border pt-6 px-4 -mb-16"
        >
            <div className="flex justify-between pb-6">
                <p className="font-medium">Email Notifications</p>
                <div className="bg-[#103544] px-4 py-1 rounded">
                    <p className="text-sm">Save</p>
                </div>
            </div>
            <div className="border-t py-4 flex justify-between">
                <p className="text-sm">Funds received</p>
                <motion.div
                    variants={{
                        rest: { backgroundColor: "#5cb9fd" },
                        hover: { backgroundColor: "#9f9fa9" },
                    }}
                    transition={{
                        type: "spring",
                    }}
                    className="flex cursor-pointer rounded-full w-8 h-4"
                >
                    <motion.div
                        variants={{
                            rest: { x: 14 },
                            hover: { x: 0 },
                        }}
                        transition={{
                            type: "spring",
                        }}
                        className="-mt-0.5 w-5 h-5 bg-white rounded-full"
                    />
                </motion.div>
            </div>
            <div className="border-t py-4 flex justify-between">
                <p className="text-sm">Announcements and updates</p>
                <motion.div
                    variants={{
                        rest: { backgroundColor: "#9f9fa9" },
                        hover: { backgroundColor: "#5cb9fd" },
                    }}
                    transition={{
                        type: "spring",
                    }}
                    className="flex cursor-pointer rounded-full w-8 h-4"
                >
                    <motion.div
                        variants={{
                            rest: { x: 0 },
                            hover: { x: 14 },
                        }}
                        transition={{
                            type: "spring",
                        }}
                        className="-mt-0.5 w-5 h-5 bg-white rounded-full"
                    />
                </motion.div>
            </div>
            <div className="border-t py-4 flex justify-between">
                <p className="text-sm">Frozen funds</p>
                <motion.div
                    variants={{
                        rest: { backgroundColor: "#5cb9fd" },
                        hover: { backgroundColor: "#9f9fa9" },
                    }}
                    transition={{
                        type: "spring",
                    }}
                    className="flex cursor-pointer rounded-full w-8 h-4"
                >
                    <motion.div
                        variants={{
                            rest: { x: 14 },
                            hover: { x: 0 },
                        }}
                        transition={{
                            type: "spring",
                        }}
                        className="-mt-0.5 w-5 h-5 bg-white rounded-full"
                    />
                </motion.div>
            </div>
        </motion.div>
    );
};

const DynamicDashboard = () => {
    return (
        <motion.div
            variants={{
                rest: { opacity: 0.7 },
                hover: {
                    opacity: 1,
                },
            }}
            transition={{
                type: "spring",
            }}
            className="bg-background/10 backdrop-blur-xl rounded-xl border pt-6 px-4 -mb-16 -mr-8"
        >
            <p className="font-medium pb-6">Dashboard</p>
            <div className="border-t h-64 flex">
                <div className="flex flex-col justify-between w-[10%] h-full pb-12 pt-10 pr-8 gap-8">
                    <span className="text-sm text-zinc-400">60k</span>
                    <span className="text-sm text-zinc-400">40k</span>
                    <span className="text-sm text-zinc-400">20k</span>
                </div>
                <div className="flex items-end justify-between h-full gap-2 md:gap-8">
                    <div className="h-[35%] opacity-65 bg-gradient-to-t from-zinc-900 to-zinc-700 w-12 rounded-lg" />
                    <div className="h-[25%] opacity-65 bg-gradient-to-t from-zinc-900 to-zinc-700 w-12 rounded-lg" />
                    <div className="h-[45%] opacity-65 bg-gradient-to-t from-zinc-900 to-zinc-700 w-12 rounded-lg" />
                    <div className="h-full flex flex-col justify-end items-center gap-2">
                        <span className="text-blue-300">59k</span>
                        <motion.div
                            variants={{
                                rest: { height: "70%" },
                                hover: { height: "75%" },
                            }}
                            transition={{
                                type: "spring",
                            }}
                            className="opacity-65 bg-gradient-to-t from-secondary to-primary w-12 rounded-lg"
                        />
                    </div>
                    <div className="h-[55%] opacity-65 bg-gradient-to-t from-zinc-900 to-zinc-700 w-12 rounded-lg" />
                    <div className="h-[25%] opacity-65 bg-gradient-to-t from-zinc-900 to-zinc-700 w-12 rounded-lg" />
                    <div className="h-[15%] opacity-65 bg-gradient-to-t from-zinc-900 to-zinc-700 w-12 rounded-lg" />
                </div>
            </div>
        </motion.div>
    );
};

export function Features() {
    return (
        <section className="py-24 px-2 sm:px-4 lg:px-8">
            <div className="mx-auto max-w-7xl flex items-center justify-center flex-col space-y-8">
                <div className="border-primary/50 bg-card/50 mb-4 inline-flex items-center gap-2 rounded-full border px-5 py-1.5 md:py-2 shadow-blue-600 shadow-[0_0px_16px_rgba(255,255,255,0.2)] md:shadow-[0_0px_20px_rgba(255,255,255,0.2)] backdrop-blur-sm md:mb-8">
                    <span className="text-foreground text-sm font-light tracking-normal md:tracking-wide md:text-base">
                        Features
                    </span>
                </div>
                <h1 className="text-4xl font-semibold max-w-2xl leading-tight text-center text-pretty">
                    Latest advanced technologies to ensure everything you need
                </h1>
                <p className="max-w-xl text-center text-zinc-300 font-light">
                    From smart automation to enterprise-grade security.the
                    platform is powered by advanced technology to get your work
                    done.
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full">
                    <motion.div
                        initial={false}
                        whileHover="hover"
                        animate="rest"
                        className="col-span-1 md:col-span-2 h-full bg-gradient-to-tr from-primary/30 via-background to-primary/20 group bg-background hover-primary/30 relative cursor-pointer flex flex-col md:flex-row justify-between overflow-hidden rounded-xl gap-4 pl-10 pt-12 pb-10 shadow-md transition-all duration-500"
                    >
                        <div className="w-full md:w-1/2 flex flex-col justify-between items-start gap-8 md:gap-20">
                            <div className="space-y-4 md:space-y-6 z-20">
                                <h2 className="text-3xl font-medium">
                                    Dynamic Dashboard
                                </h2>
                                <p className="text-sm font-light">
                                    No more guessing what&apos;s happening. Our
                                    customizable dashboard brings together key
                                    metrics and deadlines so you always have a
                                    clear view of your entire business.
                                </p>
                            </div>
                            <Button variant="outline" className="z-20">
                                <Link href="/dashboard">View Dashboard</Link>
                            </Button>
                        </div>
                        <div className="w-1/2">
                            <div className="absolute inset-0 z-10 h-full backdrop-blur-xl opacity-80 bg-black/20 mask-to-b" />
                            <DynamicDashboard />
                        </div>
                    </motion.div>
                    <motion.div
                        initial={false}
                        whileHover="hover"
                        animate="rest"
                        className="col-span-1 h-full group bg-gradient-to-br space-y-6 from-primary/30 via-background to-primary/20 hover-primary/30 relative cursor-pointer flex flex-col justify-between overflow-hidden rounded-xl px-4 pt-8 pb-10 shadow-md transition-all duration-500"
                    >
                        <div className="space-y-6 px-6">
                            <h2 className="text-3xl font-medium">
                                Smart Notifications
                            </h2>
                            <p className="text-sm font-light w-[75%]">
                                Get relevant updates based on your payments. No
                                clutter, just the information you need to act
                                fast.
                            </p>
                        </div>
                        <div className="absolute inset-0 z-10 h-full backdrop-blur-xl opacity-80 bg-black/20 mask-to-b" />
                        <div className="">
                            <SmartNotifications />
                        </div>
                    </motion.div>
                    <motion.div
                        initial={false}
                        whileHover="hover"
                        animate="rest"
                        className="col-span-1 h-full group bg-gradient-to-bl space-y-6 from-primary/20 via-background to-primary/20 hover-primary/30 relative cursor-pointer flex flex-col justify-between overflow-hidden rounded-xl px-4 pt-8 pb-10 shadow-md transition-all duration-500"
                    >
                        <div className="space-y-6 px-8">
                            <h2 className="text-3xl font-medium">
                                Lightning Speed
                            </h2>
                            <p className="text-sm font-light w-[75%]">
                                Experience lightning-fast transactions and
                                real-time updates, ensuring you never miss a
                                beat.
                            </p>
                        </div>
                        <div className="absolute inset-0 z-10 h-full backdrop-blur-xl opacity-80 bg-black/20 mask-to-b" />
                        <div className="relative">
                            <SmartNotifications />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
