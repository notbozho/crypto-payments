import { SUPPORTED_TOKENS } from "./constants";
import { ChainType } from "./types";

export * from "./types";
export * from "./constants";
export * from "./validation";

export const getTokenByAddress = (chainType: ChainType, address: string) => {
    return SUPPORTED_TOKENS[chainType].find(
        (token) => token.address.toLowerCase() === address.toLowerCase()
    );
};

export const getNativeToken = (chainType: ChainType) => {
    return SUPPORTED_TOKENS[chainType].find((token) => token.address === "0x0");
};
