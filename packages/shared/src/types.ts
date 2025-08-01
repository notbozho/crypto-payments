export enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    CONFIRMED = "confirmed",
    FAILED = "failed",
    EXPIRED = "expired",
}

export enum ChainType {
    // Mainnets
    ETHEREUM = "ethereum",
    POLYGON = "polygon",
    ARBITRUM = "arbitrum",
    OPTIMISM = "optimism",

    // Testnets
    ETHEREUM_SEPOLIA = "ethereum-sepolia",
    POLYGON_MUMBAI = "polygon-mumbai",
    ARBITRUM_GOERLI = "arbitrum-goerli",

    // Local
    ANVIL = "anvil",
}

export interface SupportedToken {
    symbol: string;
    name: string;
    address: string; // '0x0' for native tokens
    decimals: number;
    chainType: ChainType;
}

export interface PaymentLink {
    id: string;
    sellerId: string;
    amount: string; // BigInt as string
    tokenAddress: string; // '0x0' for native
    chainType: ChainType;
    description?: string;
    walletAddress: string;
    privateKey: string; // Encrypted
    status: PaymentStatus;
    expiresAt?: Date;
    createdAt: Date;
}

export interface Transaction {
    id: string;
    paymentLinkId: string;
    txHash?: string;
    fromAddress: string;
    toAddress: string;
    amount: string;
    tokenAddress: string;
    chainType: ChainType;
    gasUsed?: string;
    blockNumber?: number;
    status: PaymentStatus;
    createdAt: Date;
    confirmedAt?: Date;
}
