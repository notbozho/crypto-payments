import dotenv from "dotenv";

dotenv.config();

export const config = {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || "development",

    // Urls
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

    // Wallet derivation
    masterSeed: process.env.MASTER_SEED || "",
    encryptionKey: process.env.ENCRYPTION_KEY || "",

    // RPC URLs for different chains
    rpcUrls: {
        ethereum: process.env.ETHEREUM_RPC_URL,
        polygon: process.env.POLYGON_RPC_URL,
        mumbai: process.env.MUMBAI_RPC_URL,
        sepolia: process.env.SEPOLIA_RPC_URL,
        anvil: process.env.ANVIL_RPC_URL || "http://127.0.0.1:8545",
    },
};
