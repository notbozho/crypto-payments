import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { Prisma, prisma } from "@crypto-payments/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export class TOTPService {
    private static readonly APP_NAME = "CryptoPay";
    private static readonly ISSUER = "CryptoPay";

    // Generate TOTP secret and setup data
    static async generateTOTPSetup(sellerId: string, sellerEmail: string) {
        const secret = speakeasy.generateSecret({
            name: `${this.APP_NAME} (${sellerEmail})`,
            issuer: this.ISSUER,
            length: 32,
        });

        const backupCodes = this.generateBackupCodes();

        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

        return {
            secret: secret.base32,
            qrCode: qrCodeUrl,
            manualEntryKey: secret.base32,
            backupCodes,
        };
    }

    static verifyTOTPSetup(secret: string, token: string): boolean {
        return speakeasy.totp.verify({
            secret,
            encoding: "base32",
            token,
            window: 1,
        });
    }

    static async enableTOTP(
        sellerId: string,
        secret: string,
        backupCodes: string[]
    ) {
        const hashedCodes = await Promise.all(
            backupCodes.map((code) => bcrypt.hash(code, 12))
        );

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            await tx.seller.update({
                where: { id: sellerId },
                data: {
                    totpSecret: secret,
                    totpEnabled: true,
                },
            });

            await tx.backupCode.createMany({
                data: hashedCodes.map((hashedCode) => ({
                    sellerId,
                    codeHash: hashedCode,
                })),
            });
        });
    }

    static async verifyTOTP(sellerId: string, token: string): Promise<boolean> {
        const seller = await prisma.seller.findUnique({
            where: { id: sellerId },
            select: { totpSecret: true, totpEnabled: true },
        });

        if (!seller?.totpSecret || !seller.totpEnabled) {
            return false;
        }

        return speakeasy.totp.verify({
            secret: seller.totpSecret,
            encoding: "base32",
            token,
            window: 1,
        });
    }

    static async verifyBackupCode(
        sellerId: string,
        inputCode: string
    ): Promise<boolean> {
        const backupCodes = await prisma.backupCode.findMany({
            where: {
                sellerId,
                usedAt: null,
            },
        });

        for (const backupCode of backupCodes) {
            const isValid = await bcrypt.compare(
                inputCode.toUpperCase(),
                backupCode.codeHash
            );

            if (isValid) {
                await prisma.backupCode.update({
                    where: { id: backupCode.id },
                    data: { usedAt: new Date() },
                });
                return true;
            }
        }

        return false;
    }

    private static generateBackupCodes(): string[] {
        return Array.from({ length: 8 }, () => {
            return crypto.randomBytes(4).toString("hex").toUpperCase();
        });
    }

    static async getRemainingBackupCodes(sellerId: string): Promise<number> {
        return await prisma.backupCode.count({
            where: {
                sellerId,
                usedAt: null,
            },
        });
    }

    static async regenerateBackupCodes(sellerId: string): Promise<string[]> {
        const newCodes = this.generateBackupCodes();
        const hashedCodes = await Promise.all(
            newCodes.map((code) => bcrypt.hash(code, 12))
        );

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            await tx.backupCode.deleteMany({
                where: { sellerId },
            });

            await tx.backupCode.createMany({
                data: hashedCodes.map((hashedCode) => ({
                    sellerId,
                    codeHash: hashedCode,
                })),
            });
        });

        return newCodes;
    }

    static async disableTOTP(sellerId: string): Promise<void> {
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            await tx.seller.update({
                where: { id: sellerId },
                data: {
                    totpSecret: null,
                    totpEnabled: false,
                },
            });

            await tx.backupCode.deleteMany({
                where: { sellerId },
            });
        });
    }
}
