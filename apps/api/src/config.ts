import dotenv from "dotenv";

dotenv.config();

export const config = {
    // General
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || "development",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

    // Email
    email: {
        host: process.env.EMAIL_HOST || "sandbox.smtp.mailtrap.io",
        port: parseInt(process.env.EMAIL_PORT || "2525"),
        user: process.env.EMAIL_USER || "",
        password: process.env.EMAIL_PASSWORD || "",
        from: process.env.EMAIL_FROM || "noreply@cryptopay.com",
    },

    // Redis
    redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD || undefined,
    },

    // Secrets
    emailVerificationSecret:
        process.env.EMAIL_VERIFICATION_SECRET || "email-verification-secret",
    passwordResetSecret:
        process.env.PASSWORD_RESET_SECRET || "password-reset-secret",

    // Wallet security
    masterSeed: process.env.MASTER_SEED || "",
    encryptionKey: process.env.ENCRYPTION_KEY || "",

    // RPC URLs
    rpcUrls: {
        ethereum: process.env.ETHEREUM_RPC_URL,
        polygon: process.env.POLYGON_RPC_URL,
        mumbai: process.env.MUMBAI_RPC_URL,
        sepolia: process.env.SEPOLIA_RPC_URL,
        anvil: process.env.ANVIL_RPC_URL || "http://127.0.0.1:8545",
    },
};
