// packages/shared/src/constants.ts

import { ChainConfig, ChainType, ChainStatus, SupportedToken } from "./types";

const ETHEREUM_TOKENS: SupportedToken[] = [
    {
        symbol: "ETH",
        name: "Ethereum",
        address: "0x0000000000000000000000000000000000000000",
        decimals: 18,
        isNative: true,
        isStablecoin: false,
        coingeckoId: "ethereum"
    },
    {
        symbol: "USDC",
        name: "USD Coin",
        address: "0xA0b86a33E6441210b4f45b3B9b2d77ab6F26E3A2",
        decimals: 6,
        isNative: false,
        isStablecoin: true,
        coingeckoId: "usd-coin"
    },
    {
        symbol: "USDT",
        name: "Tether USD",
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        decimals: 6,
        isNative: false,
        isStablecoin: true,
        coingeckoId: "tether"
    },
    {
        symbol: "DAI",
        name: "Dai Stablecoin",
        address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        decimals: 18,
        isNative: false,
        isStablecoin: true,
        coingeckoId: "dai"
    },
    {
        symbol: "WETH",
        name: "Wrapped Ethereum",
        address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        decimals: 18,
        isNative: false,
        isStablecoin: false,
        coingeckoId: "weth"
    }
];

const POLYGON_TOKENS: SupportedToken[] = [
    {
        symbol: "MATIC",
        name: "Polygon",
        address: "0x0000000000000000000000000000000000000000",
        decimals: 18,
        isNative: true,
        isStablecoin: false,
        coingeckoId: "matic-network"
    },
    {
        symbol: "USDC",
        name: "USD Coin",
        address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        decimals: 6,
        isNative: false,
        isStablecoin: true,
        coingeckoId: "usd-coin"
    },
    {
        symbol: "USDT",
        name: "Tether USD",
        address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        decimals: 6,
        isNative: false,
        isStablecoin: true,
        coingeckoId: "tether"
    },
    {
        symbol: "DAI",
        name: "Dai Stablecoin",
        address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
        decimals: 18,
        isNative: false,
        isStablecoin: true,
        coingeckoId: "dai"
    },
    {
        symbol: "WMATIC",
        name: "Wrapped MATIC",
        address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
        decimals: 18,
        isNative: false,
        isStablecoin: false,
        coingeckoId: "wmatic"
    }
];

const SEPOLIA_TOKENS: SupportedToken[] = [
    {
        symbol: "ETH",
        name: "Sepolia Ethereum",
        address: "0x0000000000000000000000000000000000000000",
        decimals: 18,
        isNative: true,
        isStablecoin: false
    },
    {
        symbol: "USDC",
        name: "USD Coin (Testnet)",
        address: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
        decimals: 6,
        isNative: false,
        isStablecoin: true
    }
];

const MUMBAI_TOKENS: SupportedToken[] = [
    {
        symbol: "MATIC",
        name: "Mumbai MATIC",
        address: "0x0000000000000000000000000000000000000000",
        decimals: 18,
        isNative: true,
        isStablecoin: false
    }
];

const ANVIL_TOKENS: SupportedToken[] = [
    {
        symbol: "ETH",
        name: "Anvil Ethereum",
        address: "0x0000000000000000000000000000000000000000",
        decimals: 18,
        isNative: true,
        isStablecoin: false
    }
];

export const SUPPORTED_CHAINS: Record<ChainType, ChainConfig> = {
    [ChainType.ETHEREUM]: {
        id: 1,
        type: ChainType.ETHEREUM,
        name: "Ethereum Mainnet",
        symbol: "ETH",
        rpcUrl: process.env.ETHEREUM_RPC_URL || "",
        backupRpcUrls: [
            "https://eth-mainnet.g.alchemy.com/v2/demo",
            "https://ethereum.publicnode.com",
            "https://rpc.ankr.com/eth"
        ],
        blockExplorer: "https://etherscan.io",
        supportsEIP1559: true,
        avgBlockTime: 12,
        wrappedNativeToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        usdcAddress: "0xA0b86a33E6441210b4f45b3B9b2d77ab6F26E3A2",
        uniswapV3Router: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        uniswapV3Quoter: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
        status: ChainStatus.ACTIVE,
        supportedTokens: ETHEREUM_TOKENS
    },
    
    [ChainType.POLYGON]: {
        id: 137,
        type: ChainType.POLYGON,
        name: "Polygon Mainnet",
        symbol: "MATIC",
        rpcUrl: process.env.POLYGON_RPC_URL || "",
        backupRpcUrls: [
            "https://polygon-rpc.com",
            "https://rpc.ankr.com/polygon",
            "https://polygon-mainnet.g.alchemy.com/v2/demo"
        ],
        blockExplorer: "https://polygonscan.com",
        supportsEIP1559: true,
        avgBlockTime: 2,
        wrappedNativeToken: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
        usdcAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        uniswapV3Router: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        uniswapV3Quoter: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
        status: ChainStatus.ACTIVE,
        supportedTokens: POLYGON_TOKENS
    },

    [ChainType.ETHEREUM_SEPOLIA]: {
        id: 11155111,
        type: ChainType.ETHEREUM_SEPOLIA,
        name: "Sepolia Testnet",
        symbol: "ETH",
        rpcUrl: process.env.SEPOLIA_RPC_URL || "",
        backupRpcUrls: [
            "https://sepolia.infura.io/v3/demo",
            "https://rpc.sepolia.org"
        ],
        blockExplorer: "https://sepolia.etherscan.io",
        supportsEIP1559: true,
        avgBlockTime: 12,
        wrappedNativeToken: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
        usdcAddress: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
        uniswapV3Router: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
        uniswapV3Quoter: "0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3",
        status: ChainStatus.ACTIVE,
        supportedTokens: SEPOLIA_TOKENS
    },

    [ChainType.POLYGON_MUMBAI]: {
        id: 80001,
        type: ChainType.POLYGON_MUMBAI,
        name: "Mumbai Testnet",
        symbol: "MATIC",
        rpcUrl: process.env.MUMBAI_RPC_URL || "",
        backupRpcUrls: [
            "https://rpc-mumbai.maticvigil.com",
            "https://polygon-mumbai.g.alchemy.com/v2/demo"
        ],
        blockExplorer: "https://mumbai.polygonscan.com",
        supportsEIP1559: true,
        avgBlockTime: 2,
        wrappedNativeToken: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
        usdcAddress: "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23",
        uniswapV3Router: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        uniswapV3Quoter: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
        status: ChainStatus.ACTIVE,
        supportedTokens: MUMBAI_TOKENS
    },

    [ChainType.ANVIL]: {
        id: 31337,
        type: ChainType.ANVIL,
        name: "Anvil Local",
        symbol: "ETH",
        rpcUrl: process.env.ANVIL_RPC_URL || "http://127.0.0.1:8545",
        backupRpcUrls: [],
        blockExplorer: "",
        supportsEIP1559: true,
        avgBlockTime: 1,
        wrappedNativeToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        usdcAddress: "0xA0b86a33E6441210b4f45b3B9b2d77ab6F26E3A2",
        uniswapV3Router: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        uniswapV3Quoter: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
        status: ChainStatus.ACTIVE,
        supportedTokens: ANVIL_TOKENS
    },

    // Placeholder chains - implement when needed
    [ChainType.ARBITRUM]: {} as ChainConfig,
    [ChainType.OPTIMISM]: {} as ChainConfig,
    [ChainType.ARBITRUM_GOERLI]: {} as ChainConfig,
};

export const ACTIVE_CHAINS = Object.values(SUPPORTED_CHAINS).filter(
    chain => chain.status === ChainStatus.ACTIVE && chain.id
);

export const MAINNET_CHAINS = [ChainType.ETHEREUM, ChainType.POLYGON];
export const TESTNET_CHAINS = [ChainType.ETHEREUM_SEPOLIA, ChainType.POLYGON_MUMBAI, ChainType.ANVIL];