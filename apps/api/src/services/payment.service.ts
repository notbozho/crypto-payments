import { prisma } from "@crypto-payments/db";
import { WalletGenerator } from "./wallet.service";
import { CreatePaymentLinkInput, PaymentStatus } from "@crypto-payments/shared";

export interface CreatePaymentLinkResult {
    id: string;
    walletAddress: string;
    amount: string;
    chainType: string;
    tokenAddress: string;
    description?: string;
    expiresAt?: Date;
    createdAt: Date;
}

export class PaymentLinkService {
    static async createPaymentLink(
        sellerId: string,
        input: CreatePaymentLinkInput
    ): Promise<CreatePaymentLinkResult> {
        // Check if seller has wallet address
        const seller = await prisma.seller.findUnique({
            where: { id: sellerId },
            select: { walletAddress: true },
        });

        if (!seller?.walletAddress) {
            throw new Error(
                "Please set your wallet address in profile settings before creating payment links"
            );
        }

        // Generate random wallet
        const wallet = await WalletGenerator.generateWallet();

        // Calculate expiration
        const expiresAt = input.expiresIn
            ? new Date(Date.now() + input.expiresIn * 1000)
            : undefined;

        // Create payment link
        const paymentLink = await prisma.paymentLink.create({
            data: {
                sellerId,
                amount: input.amount,
                tokenAddress: input.tokenAddress,
                chainType: input.chainType,
                description: input.description,
                walletAddress: wallet.address,
                privateKey: wallet.privateKeyEncrypted,
                status: PaymentStatus.PENDING,
                expiresAt,
            },
        });

        return {
            id: paymentLink.id,
            walletAddress: paymentLink.walletAddress,
            amount: paymentLink.amount,
            chainType: paymentLink.chainType,
            tokenAddress: paymentLink.tokenAddress,
            description: paymentLink.description ?? undefined,
            expiresAt: paymentLink.expiresAt ?? undefined,
            createdAt: paymentLink.createdAt,
        };
    }

    static async getPaymentLink(id: string, includeSensitive: boolean = false) {
        const paymentLink = await prisma.paymentLink.findUnique({
            where: { id },
            include: {
                transactions: true,
                seller: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        walletAddress: includeSensitive,
                    },
                },
            },
        });

        if (!paymentLink) return null;

        if (includeSensitive) {
            return paymentLink;
        }

        const { privateKey, seller, ...publicData } = paymentLink;
        return {
            ...publicData,
            seller: {
                name: seller.name || "Anonymous",
            },
        };
    }

    static async getSellerPaymentLinks(sellerId: string) {
        return prisma.paymentLink.findMany({
            where: { sellerId },
            include: {
                transactions: true,
            },
            orderBy: { createdAt: "desc" },
        });
    }

    static async updateSellerWallet(sellerId: string, walletAddress: string) {
        return prisma.seller.update({
            where: { id: sellerId },
            data: { walletAddress },
        });
    }
}
