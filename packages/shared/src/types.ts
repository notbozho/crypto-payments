// packages/shared/src/types.ts

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

export enum ChainStatus {
    ACTIVE = "ACTIVE",
    MAINTENANCE = "MAINTENANCE",
    DEPRECATED = "DEPRECATED",
    DISABLED = "DISABLED",
}

export enum PaymentStatus {
    PENDING = "PENDING",
    DETECTED = "DETECTED",
    CONFIRMING = "CONFIRMING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED",
}

export interface SupportedToken {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    isNative: boolean;
    isStablecoin: boolean;
    coingeckoId?: string;
}

export interface ChainConfig {
    id: number;
    type: ChainType;
    name: string;
    symbol: string;
    rpcUrl: string;
    backupRpcUrls: string[];
    blockExplorer: string;

    // Gas Configuration
    supportsEIP1559: boolean;
    avgBlockTime: number;

    // Contract Addresses
    wrappedNativeToken: string;
    usdcAddress: string;
    uniswapV3Router: string;
    uniswapV3Quoter: string;

    // Status
    status: ChainStatus;
    maintenanceMessage?: string;

    // Tokens
    supportedTokens: SupportedToken[];
}

export interface GasEstimate {
    estimatedCostUSD: number;
    maxCostUSD: number;
    gasLimit: bigint;
    gasPrice: bigint;
    priority?: bigint;
}
