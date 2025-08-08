import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CryptoPay - Web3 Payment Processor",
    description: "Accept crypto payments with ease",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                {children}
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        duration: 4000,
                    }}
                />
            </body>
        </html>
    );
}
