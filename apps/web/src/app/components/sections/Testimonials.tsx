import testimonialAvatar from "@/assets/testimonial_avatar.png";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import React from "react";

const testimonials = [
    {
        review: "This is an amazing product! It has changed my life for the better.",
        authorName: "John Doe",
        authorImage: testimonialAvatar.src,
        authorRole: "CEO, Company A",
    },
    {
        review: "I can't believe how easy this is to use!",
        authorName: "Jane Smith",
        authorImage: testimonialAvatar.src,
        authorRole: "Manager, Company B",
    },
    {
        review: "This has saved me so much time and effort.",
        authorName: "John Doe",
        authorImage: testimonialAvatar.src,
        authorRole: "CEO, Company A",
    },
    {
        review: "Switching to CryptoPay was the best decision we ever made!",
        authorName: "John Doe",
        authorImage: testimonialAvatar.src,
        authorRole: "CEO, Company A",
    },
    {
        review: "Payment processing has never been easier!",
        authorName: "Jane Smith",
        authorImage: testimonialAvatar.src,
        authorRole: "CTO, Company B",
    },
    {
        review: "This product has streamlined our workflow significantly.",
        authorName: "John Doe",
        authorImage: testimonialAvatar.src,
        authorRole: "CEO, Company A",
    },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3);

const TestimonialsColumn = (props: {
    testimonials: typeof testimonials;
    className?: string;
    duration?: number;
    reverse?: boolean;
}) => {
    return (
        // <div className={props.className}>
        <motion.div
            animate={{
                translateX: props.reverse ? "100%" : "-100%",
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
                repeatType: "loop",
            }}
            className={cn(
                "flex gap-6",
                props.reverse ? "flex-row-reverse pl-6" : "flex-row pr-6"
            )}
        >
            {[...new Array(2)].fill(0).map((_, index) => (
                <React.Fragment key={index}>
                    {props.testimonials.map((testimonial, index) => (
                        <div className="testimonial-card" key={index}>
                            <p className="text-3xl font-bold bg-gradient-to-t from-blue-200 to-foreground bg-clip-text text-transparent">
                                &quot;{testimonial.review}&quot;
                            </p>
                            <div className="flex items-center mt-4">
                                <Image
                                    src={testimonial.authorImage}
                                    alt={testimonial.authorName}
                                    className="h-10 w-10 rounded-full"
                                    width={200}
                                    height={200}
                                />
                                <div className="pl-4">
                                    <p className="font-medium tracking-tight leading-5">
                                        {testimonial.authorName}
                                    </p>
                                    <p className="text-sm text-zinc-400 tracking-tight leading-5">
                                        {testimonial.authorRole}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </React.Fragment>
            ))}
        </motion.div>
        // </div>
    );
};
// .testimonial-card {
//         @apply max-w-md space-y-20 bg-gradient-to-t from-background to-primary/30 rounded-lg py-8 px-6;
//     }

export function Testimonials() {
    return (
        <section className="py-24">
            <div className="mx-auto container flex items-center justify-center flex-col space-y-8">
                <div className="border-primary/50 bg-card/50 mb-4 inline-flex items-center gap-2 rounded-full border px-5 py-1.5 md:py-2 shadow-blue-600 shadow-[0_0px_16px_rgba(255,255,255,0.2)] md:shadow-[0_0px_20px_rgba(255,255,255,0.2)] backdrop-blur-sm md:mb-8">
                    <span className="text-foreground text-sm font-light tracking-normal md:tracking-wide md:text-base">
                        Testimonials
                    </span>
                </div>
                <h1 className="text-4xl font-semibold max-w-2xl leading-tight text-center text-pretty">
                    Don&apos;t take our word for it, <br />
                    hear what our users say
                </h1>
                <p className="max-w-xl text-center text-zinc-300 font-light pb-8">
                    Join thousands of satisfied users who have transformed their
                    businesses with our platform.
                </p>

                <div className="flex flex-col gap-6 items-center justify-center [mask-image:linear-gradient(to_right,transparent,black,transparent)] overflow-hidden">
                    <TestimonialsColumn testimonials={firstColumn} />
                    <TestimonialsColumn
                        testimonials={secondColumn}
                        className="hidden md:block"
                        duration={24}
                        reverse
                    />
                </div>
            </div>
        </section>
    );
}
