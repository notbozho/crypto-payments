// api/src/services/payment-link.service.ts

import { prisma } from "@crypto-payments/db";
import crypto from "crypto";
import { parseUnits, formatUnits } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { config } from "../config";
import {
    getChainConfigById,
    getDefaultStablecoin,
    getNativeToken,
    getTokenByAddress,
    isNativeToken,
    formatTokenAddress,
    ChainType,
} from "@crypto-payments/shared";
import { ChainStatusService } from "./chain-status.service";

interface CreatePaymentLinkRequest {
    chainId: number;
    tokenAddress?: string;
    amountUSD: number;
    description?: string;
    expiresAt: Date;
    swapToStable: boolean;
    stablecoinAddress?: string;
    slippageTolerance?: number;
    minimumConfirmations?: number;
}

interface EphemeralWallet {
    address: string;
    encryptedPrivateKey: string;
    keyDerivationSalt: string;
}

interface TokenPriceData {
    price: number;
    symbol: string;
    lastUpdated: Date;
}

interface GasEstimateData {
    estimatedCostUSD: number;
    maxCostUSD: number;
    gasLimit: bigint;
    gasPrice: bigint;
}

export class PaymentLinkService {
    private readonly encryptionKey: Buffer;
    private chainStatusService = new ChainStatusService();

    constructor() {
        if (!config.encryptionKey) {
            throw new Error("ENCRYPTION_KEY not configured");
        }
        this.encryptionKey = Buffer.from(config.encryptionKey, "hex");
        if (this.encryptionKey.length !== 32) {
            throw new Error(
                "ENCRYPTION_KEY must be 32 bytes (64 hex characters)"
            );
        }
    }

    async createPaymentLink(
        sellerId: string,
        request: CreatePaymentLinkRequest
    ) {
        // Validate seller exists
        const seller = await prisma.seller.findUnique({
            where: { id: sellerId },
        });

        if (!seller) {
            throw new Error("Seller not found");
        }

        // Validate expiry date
        const now = new Date();
        if (request.expiresAt <= now) {
            throw new Error("Expiry date must be in the future");
        }

        const maxExpiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year max
        if (request.expiresAt > maxExpiry) {
            throw new Error(
                "Expiry date cannot be more than 1 year in the future"
            );
        }

        // Validate chain config exists and is active
        const chainConfig = getChainConfigById(request.chainId);
        const isActive = await this.chainStatusService.isChainActive(
            request.chainId
        );

        if (!isActive) {
            throw new Error("Chain is currently disabled or under maintenance");
        }

        // Validate token exists on chain
        const tokenAddress = request.tokenAddress
            ? formatTokenAddress(request.tokenAddress)
            : "0x0000000000000000000000000000000000000000";

        const token = isNativeToken(tokenAddress)
            ? getNativeToken(chainConfig.type as ChainType)
            : getTokenByAddress(chainConfig.type as ChainType, tokenAddress);

        if (!token) {
            throw new Error(
                `Token ${tokenAddress} not supported on ${chainConfig.name}`
            );
        }

        // Set default stablecoin if swapping
        if (request.swapToStable && !request.stablecoinAddress) {
            const defaultStable = getDefaultStablecoin(
                chainConfig.type as ChainType
            );
            request.stablecoinAddress = defaultStable.address;
        }

        // Validate stablecoin exists if specified
        if (request.stablecoinAddress) {
            const stablecoin = getTokenByAddress(
                chainConfig.type as ChainType,
                request.stablecoinAddress
            );
            if (!stablecoin || !stablecoin.isStablecoin) {
                throw new Error("Invalid stablecoin address");
            }
        }

        // Get token price and calculate amount
        const tokenPrice = await this.getTokenPrice(
            chainConfig.type as ChainType,
            tokenAddress
        );
        const tokenAmount = this.calculateTokenAmount(
            request.amountUSD,
            tokenPrice.price,
            token.decimals
        );

        // Estimate gas costs
        const gasEstimate = await this.estimateGasCosts(
            request.chainId,
            request.swapToStable,
            tokenAmount,
            tokenAddress
        );

        // Generate ephemeral wallet
        const ephemeralWallet = await this.generateEphemeralWallet(
            sellerId,
            request.chainId
        );

        // Create payment link
        const paymentLink = await prisma.paymentLink.create({
            data: {
                sellerId,
                chainId: request.chainId,
                tokenAddress: isNativeToken(tokenAddress) ? null : tokenAddress,
                amount: tokenAmount,
                amountUSD: request.amountUSD,
                description: request.description,
                swapToStable: request.swapToStable,
                stablecoinAddress: request.stablecoinAddress,
                slippageTolerance: request.slippageTolerance || 5.0,
                estimatedGasCostUSD: gasEstimate.estimatedCostUSD,
                maxGasCostUSD: gasEstimate.maxCostUSD,
                walletAddress: ephemeralWallet.address,
                encryptedPrivateKey: ephemeralWallet.encryptedPrivateKey,
                keyDerivationSalt: ephemeralWallet.keyDerivationSalt,
                minimumConfirmations: request.minimumConfirmations || 3,
                expiresAt: request.expiresAt,
            },
            include: {
                seller: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });

        return this.formatPaymentLinkResponse(paymentLink);
    }

    async getPaymentLinks(
        sellerId: string,
        options?: {
            status?: string;
            chainId?: number;
            limit?: number;
            offset?: number;
        }
    ) {
        const where: any = { sellerId };

        if (options?.status) {
            where.status = options.status;
        }

        if (options?.chainId) {
            where.chainId = options.chainId;
        }

        const paymentLinks = await prisma.paymentLink.findMany({
            where,
            include: {
                _count: {
                    select: {
                        transactions: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: options?.limit || 50,
            skip: options?.offset || 0,
        });

        return paymentLinks.map((link) => this.formatPaymentLinkResponse(link));
    }

    async getPaymentLink(id: string, sellerId: string) {
        const paymentLink = await prisma.paymentLink.findFirst({
            where: {
                id,
                sellerId,
            },
            include: {
                transactions: {
                    orderBy: {
                        createdAt: "desc",
                    },
                },
                seller: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        walletAddress: true,
                    },
                },
            },
        });

        if (!paymentLink) {
            throw new Error("Payment link not found");
        }

        return this.formatPaymentLinkResponse(paymentLink);
    }

    async getPublicPaymentLink(id: string) {
        const paymentLink = await prisma.paymentLink.findUnique({
            where: { id },
            include: {
                seller: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!paymentLink) {
            throw new Error("Payment link not found");
        }

        if (
            paymentLink.status === "EXPIRED" ||
            paymentLink.expiresAt < new Date()
        ) {
            throw new Error("Payment link has expired");
        }

        if (paymentLink.status === "CANCELLED") {
            throw new Error("Payment link has been cancelled");
        }

        // Get chain config for display
        const chainConfig = getChainConfigById(paymentLink.chainId);
        const token = paymentLink.tokenAddress
            ? getTokenByAddress(
                  chainConfig.type as ChainType,
                  paymentLink.tokenAddress
              )
            : getNativeToken(chainConfig.type as ChainType);

        return {
            id: paymentLink.id,
            chainId: paymentLink.chainId,
            chainName: chainConfig.name,
            tokenSymbol: token?.symbol,
            tokenName: token?.name,
            tokenDecimals: token?.decimals,
            tokenAddress: paymentLink.tokenAddress,
            amount: paymentLink.amount,
            amountUSD: paymentLink.amountUSD,
            description: paymentLink.description,
            walletAddress: paymentLink.walletAddress,
            status: paymentLink.status,
            expiresAt: paymentLink.expiresAt,
            minimumConfirmations: paymentLink.minimumConfirmations,
            seller: paymentLink.seller,
            createdAt: paymentLink.createdAt,
        };
    }

    async cancelPaymentLink(id: string, sellerId: string) {
        const paymentLink = await prisma.paymentLink.findFirst({
            where: {
                id,
                sellerId,
                status: "PENDING",
            },
        });

        if (!paymentLink) {
            throw new Error("Payment link not found or cannot be cancelled");
        }

        const updated = await prisma.paymentLink.update({
            where: { id },
            data: {
                status: "CANCELLED",
                updatedAt: new Date(),
            },
        });

        return this.formatPaymentLinkResponse(updated);
    }

    async getAvailableChains() {
        return await this.chainStatusService.getActiveChains();
    }

    async getPaymentLinkStats(sellerId: string) {
        const stats = await prisma.paymentLink.groupBy({
            by: ["status"],
            where: { sellerId },
            _count: {
                status: true,
            },
            _sum: {
                amountUSD: true,
            },
        });

        const totalLinks = await prisma.paymentLink.count({
            where: { sellerId },
        });

        const completedLinks = await prisma.paymentLink.count({
            where: {
                sellerId,
                status: "COMPLETED",
            },
        });

        const totalVolume = await prisma.paymentLink.aggregate({
            where: {
                sellerId,
                status: "COMPLETED",
            },
            _sum: {
                amountUSD: true,
            },
        });

        return {
            totalLinks,
            completedLinks,
            completionRate:
                totalLinks > 0 ? (completedLinks / totalLinks) * 100 : 0,
            totalVolumeUSD: totalVolume._sum.amountUSD || 0,
            statusBreakdown: stats.reduce((acc, stat) => {
                acc[stat.status] = {
                    count: stat._count.status,
                    volume: Number(stat._sum.amountUSD) || 0,
                };
                return acc;
            }, {} as Record<string, { count: number; volume: number }>),
        };
    }

    private async generateEphemeralWallet(
        sellerId: string,
        chainId: number
    ): Promise<EphemeralWallet> {
        // Generate salt for key derivation
        const salt = crypto.randomBytes(32);

        // Create deterministic but unique seed
        const seedInput = `${
            config.masterSeed
        }:${sellerId}:${chainId}:${Date.now()}:${crypto
            .randomBytes(16)
            .toString("hex")}`;
        const seed = crypto.pbkdf2Sync(seedInput, salt, 100000, 32, "sha256");

        // Generate private key using viem
        const privateKey = generatePrivateKey();

        // Create account from private key to get address
        const account = privateKeyToAccount(privateKey);

        // Encrypt private key
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            "aes-256-gcm",
            this.encryptionKey,
            iv
        );

        let encrypted = cipher.update(privateKey, "utf8", "hex");
        encrypted += cipher.final("hex");
        const authTag = cipher.getAuthTag();

        const encryptedPrivateKey =
            iv.toString("hex") +
            ":" +
            authTag.toString("hex") +
            ":" +
            encrypted;

        return {
            address: account.address,
            encryptedPrivateKey,
            keyDerivationSalt: salt.toString("hex"),
        };
    }

    private async getTokenPrice(
        chainType: ChainType,
        tokenAddress: string
    ): Promise<TokenPriceData> {
        // CRITICAL TODO: Implement real price oracle integration
        // Options: CoinGecko API, CoinMarketCap API, Chainlink Price Feeds
        // For now, return mock data

        console.warn("🚨 USING MOCK PRICES - IMPLEMENT REAL PRICE ORACLE");

        const mockPrices: Record<string, number> = {
            "0x0000000000000000000000000000000000000000": 2500, // ETH/MATIC
            "0xA0b86a33E6441210b4f45b3B9b2d77ab6F26E3A2": 1.0, // USDC
            "0xdAC17F958D2ee523a2206206994597C13D831ec7": 1.0, // USDT
            "0x6B175474E89094C44Da98b954EedeAC495271d0F": 1.0, // DAI
            "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174": 1.0, // USDC Polygon
            "0xc2132D05D31c914a87C6611C10748AEb04B58e8F": 1.0, // USDT Polygon
            "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063": 1.0, // DAI Polygon
        };

        return {
            price: mockPrices[tokenAddress] || 1.0,
            symbol: "MOCK",
            lastUpdated: new Date(),
        };
    }

    private calculateTokenAmount(
        amountUSD: number,
        tokenPrice: number,
        decimals: number
    ): string {
        const tokenAmount = amountUSD / tokenPrice;
        return parseUnits(tokenAmount.toString(), decimals).toString();
    }

    private async estimateGasCosts(
        chainId: number,
        includeSwap: boolean,
        amount: string,
        tokenAddress: string
    ): Promise<GasEstimateData> {
        // CRITICAL TODO: Implement real gas estimation
        // This needs to connect to RPC providers and simulate transactions

        console.warn(
            "🚨 USING MOCK GAS ESTIMATES - IMPLEMENT REAL GAS ESTIMATION"
        );

        const chainConfig = getChainConfigById(chainId);

        // Mock gas estimates based on chain
        let gasLimit = BigInt(21000); // Basic transfer

        if (!isNativeToken(tokenAddress)) {
            gasLimit += BigInt(65000); // ERC20 transfer overhead
        }

        if (includeSwap) {
            gasLimit += BigInt(150000); // Uniswap swap overhead
        }

        // Mock gas price (should come from RPC)
        const gasPrice =
            chainId === 1 ? BigInt(20000000000) : BigInt(30000000000); // 20 or 30 gwei

        const gasCost = gasLimit * gasPrice;
        const gasCostETH = Number(formatUnits(gasCost, 18));
        const estimatedCostUSD = gasCostETH * 2500; // Mock ETH price

        return {
            estimatedCostUSD,
            maxCostUSD: estimatedCostUSD * 1.5, // 50% buffer
            gasLimit,
            gasPrice,
        };
    }

    private formatPaymentLinkResponse(paymentLink: any) {
        // Remove sensitive data
        const { encryptedPrivateKey, keyDerivationSalt, ...safeData } =
            paymentLink;

        // Add chain info
        try {
            const chainConfig = getChainConfigById(paymentLink.chainId);
            const token = paymentLink.tokenAddress
                ? getTokenByAddress(
                      chainConfig.type as ChainType,
                      paymentLink.tokenAddress
                  )
                : getNativeToken(chainConfig.type as ChainType);

            return {
                ...safeData,
                chain: {
                    id: chainConfig.id,
                    name: chainConfig.name,
                    symbol: chainConfig.symbol,
                    blockExplorer: chainConfig.blockExplorer,
                },
                token: {
                    symbol: token?.symbol,
                    name: token?.name,
                    decimals: token?.decimals,
                    address:
                        paymentLink.tokenAddress ||
                        "0x0000000000000000000000000000000000000000",
                },
            };
        } catch (error) {
            console.error("Error formatting payment link:", error);
            return safeData;
        }
    }
}
