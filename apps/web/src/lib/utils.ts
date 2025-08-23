import { clsx, type ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export async function copyToClipboard(text: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
    }

    toast.success("Copied to clipboard");
}

export function formatAddress(address: string, start = 6, end = 4) {
    if (!address) return "";
    return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatCurrency(amount: number | string, currency = "USD") {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
}

export function formatDate(
    date: string | Date,
    options?: Intl.DateTimeFormatOptions
) {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        ...options,
    }).format(dateObj);
}

export function formatTokenAmount(
    amount: string,
    decimals: number = 18
): string {
    const num = parseFloat(amount);
    if (num === 0) return "0";

    // For small amounts, show more decimals
    if (num < 0.01) return num.toFixed(8);
    if (num < 1) return num.toFixed(6);
    return num.toFixed(4);
}

export function getTimeRemaining(expiresAt: string): {
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
} {
    const now = Date.now();
    const expiry = new Date(expiresAt).getTime();
    const total = Math.max(0, expiry - now);

    return {
        total,
        hours: Math.floor(total / (1000 * 60 * 60)),
        minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((total % (1000 * 60)) / 1000),
    };
}
