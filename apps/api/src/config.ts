import { ExpressAuthConfig } from "@auth/express";
import Credentials from "@auth/express/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import dotenv from "dotenv";
import { prisma } from "@crypto-payments/db";
import bcrypt from "bcryptjs";

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
    authSecret: process.env.AUTH_SECRET || "auth-secret",

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

declare module "@auth/express" {
    interface Session {
        user: {
            id: string;
            email?: string;
            name?: string;
            requires2FA?: boolean;
            is2FAVerified?: boolean;
        };
        action2faVerifiedAt?: number;
    }
}

export const authConfig: ExpressAuthConfig = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    debug: config.nodeEnv === "development",
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const seller = await prisma.seller.findUnique({
                    where: { email: credentials.email as string },
                });

                if (!seller?.passwordHash) return null;

                const isValid = await bcrypt.compare(
                    credentials.password as string,
                    seller.passwordHash
                );

                if (!isValid) return null;

                return {
                    id: seller.id,
                    email: seller.email,
                    name: seller.name,
                    requires2FA: seller.totpEnabled,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.requires2FA = (user as any).requires2FA;
                token.id = user.id;
                token.is2FAVerified = false;
            }

            if (trigger === "update" && session?.is2FAVerified !== undefined) {
                token.is2FAVerified = session.user.is2FAVerified;
            }

            if (trigger === "update" && session?.action2faVerifiedAt) {
                token.action2faVerifiedAt = session.action2faVerifiedAt;
            }

            return token;
        },
        session({ session, token }) {
            if (token.requires2FA) {
                session.user.requires2FA = token.requires2FA as boolean;
            }
            session.user.id = token.id as string;
            session.user.is2FAVerified = token.is2FAVerified as boolean;
            session.action2faVerifiedAt = token.action2faVerifiedAt as number;
            return session;
        },
    },
    trustHost: true,
};
