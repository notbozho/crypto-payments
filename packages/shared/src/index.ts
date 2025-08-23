// packages/shared/src/index.ts

export * from "./types";
export * from "./constants";
export * from "./validation";

import { SUPPORTED_CHAINS } from "./constants";
import { ChainType, SupportedToken } from "./types";

export const getChainConfig = (chainType: ChainType) => {
    const config = SUPPORTED_CHAINS[chainType];
    if (!config.id) {
        throw new Error(`Chain ${chainType} is not implemented yet`);
    }
    return config;
};

export const getChainConfigById = (chainId: number) => {
    const chain = Object.values(SUPPORTED_CHAINS).find((c) => c.id === chainId);
    if (!chain) {
        throw new Error(`Chain ID ${chainId} not supported`);
    }
    return chain;
};

export const getTokenByAddress = (
    chainType: ChainType,
    address: string
): SupportedToken | undefined => {
    const chain = getChainConfig(chainType);
    return chain.supportedTokens.find(
        (token) => token.address.toLowerCase() === address.toLowerCase()
    );
};

export const getNativeToken = (chainType: ChainType): SupportedToken => {
    const chain = getChainConfig(chainType);
    const nativeToken = chain.supportedTokens.find((token) => token.isNative);
    if (!nativeToken) {
        throw new Error(`No native token found for ${chainType}`);
    }
    return nativeToken;
};

export const getStablecoins = (chainType: ChainType): SupportedToken[] => {
    const chain = getChainConfig(chainType);
    return chain.supportedTokens.filter((token) => token.isStablecoin);
};

export const getDefaultStablecoin = (chainType: ChainType): SupportedToken => {
    const stablecoins = getStablecoins(chainType);
    const usdc = stablecoins.find((token) => token.symbol === "USDC");
    return usdc || stablecoins[0];
};

export const isNativeToken = (address: string): boolean => {
    return (
        address === "0x0000000000000000000000000000000000000000" ||
        address === "0x0"
    );
};

export const formatTokenAddress = (address: string): string => {
    return isNativeToken(address)
        ? "0x0000000000000000000000000000000000000000"
        : address;
};
