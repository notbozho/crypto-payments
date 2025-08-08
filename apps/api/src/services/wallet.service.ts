import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { prisma } from "@crypto-payments/db";
import { encryptPrivateKey } from "../utils/crypto";

export interface GeneratedWallet {
    address: string;
    privateKeyEncrypted: string;
}

export class WalletGenerationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "WalletGenerationError";
    }
}

export class WalletGenerator {
    private static readonly MAX_COLLISION_RETRIES = 3;

    static async generateWallet(): Promise<GeneratedWallet> {
        let attempts = 0;

        while (attempts < this.MAX_COLLISION_RETRIES) {
            try {
                const privateKey = generatePrivateKey();
                const account = privateKeyToAccount(privateKey);
                const address = account.address;

                // Check collision
                const existing = await prisma.paymentLink.findFirst({
                    where: { walletAddress: address },
                });

                if (existing) {
                    attempts++;
                    console.warn(
                        `Wallet collision detected, retrying... (${attempts}/${this.MAX_COLLISION_RETRIES})`
                    );
                    continue;
                }

                const privateKeyEncrypted = encryptPrivateKey(privateKey);

                return {
                    address,
                    privateKeyEncrypted,
                };
            } catch (error: any) {
                throw new WalletGenerationError(
                    `Failed to generate wallet: ${error.message}`
                );
            }
        }

        throw new WalletGenerationError(
            `Failed to generate unique wallet after ${this.MAX_COLLISION_RETRIES} attempts`
        );
    }
}
