import { ChainType, SupportedToken } from "./types";

export const CHAIN_CONFIG = {
    [ChainType.ETHEREUM]: {
        chainId: 1,
        rpcUrl: process.env.ETHEREUM_RPC_URL,
        explorerUrl: "https://etherscan.io",
    },
    [ChainType.POLYGON]: {
        chainId: 137,
        rpcUrl: process.env.POLYGON_RPC_URL,
        explorerUrl: "https://polygonscan.com",
    },
    [ChainType.ETHEREUM_SEPOLIA]: {
        chainId: 11155111,
        rpcUrl: process.env.SEPOLIA_RPC_URL,
        explorerUrl: "https://sepolia.etherscan.io",
    },
    [ChainType.POLYGON_MUMBAI]: {
        chainId: 80001,
        rpcUrl: process.env.MUMBAI_RPC_URL,
        explorerUrl: "https://mumbai.polygonscan.com",
    },
    [ChainType.ANVIL]: {
        chainId: 31337,
        rpcUrl: "http://127.0.0.1:8545",
        explorerUrl: null,
    },
} as const;

export const SUPPORTED_TOKENS: Record<ChainType, SupportedToken[]> = {
    [ChainType.ETHEREUM]: [
        {
            symbol: "ETH",
            name: "Ethereum",
            address: "0x0",
            decimals: 18,
            chainType: ChainType.ETHEREUM,
        },
        {
            symbol: "USDC",
            name: "USD Coin",
            address: "0xA0b86a33E6441210b4f45b3B9b2d77ab6F26E3A2",
            decimals: 6,
            chainType: ChainType.ETHEREUM,
        },
        {
            symbol: "USDT",
            name: "Tether USD",
            address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            decimals: 6,
            chainType: ChainType.ETHEREUM,
        },
        {
            symbol: "DAI",
            name: "Dai Stablecoin",
            address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
            decimals: 18,
            chainType: ChainType.ETHEREUM,
        },
    ],
    [ChainType.POLYGON]: [
        {
            symbol: "MATIC",
            name: "Polygon",
            address: "0x0",
            decimals: 18,
            chainType: ChainType.POLYGON,
        },
        {
            symbol: "USDC",
            name: "USD Coin",
            address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
            decimals: 6,
            chainType: ChainType.POLYGON,
        },
        {
            symbol: "USDT",
            name: "Tether USD",
            address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
            decimals: 6,
            chainType: ChainType.POLYGON,
        },
        {
            symbol: "DAI",
            name: "Dai Stablecoin",
            address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
            decimals: 18,
            chainType: ChainType.POLYGON,
        },
    ],
    [ChainType.ETHEREUM_SEPOLIA]: [
        {
            symbol: "ETH",
            name: "Ethereum",
            address: "0x0",
            decimals: 18,
            chainType: ChainType.ETHEREUM_SEPOLIA,
        },
        // Testnet tokens - you'd use faucet tokens or deploy your own
        {
            symbol: "USDC",
            name: "USD Coin (Test)",
            address: "0x...",
            decimals: 6,
            chainType: ChainType.ETHEREUM_SEPOLIA,
        },
    ],
    [ChainType.POLYGON_MUMBAI]: [
        {
            symbol: "MATIC",
            name: "Mumbai MATIC",
            address: "0x0",
            decimals: 18,
            chainType: ChainType.POLYGON_MUMBAI,
        },
        // Mumbai testnet tokens
    ],
    [ChainType.ANVIL]: [
        {
            symbol: "ETH",
            name: "Ethereum",
            address: "0x0",
            decimals: 18,
            chainType: ChainType.ANVIL,
        },
        // For Anvil, you can deploy mock tokens or fork from mainnet
    ],
    [ChainType.ARBITRUM]: [],
    [ChainType.OPTIMISM]: [],
    [ChainType.ARBITRUM_GOERLI]: [],
};
