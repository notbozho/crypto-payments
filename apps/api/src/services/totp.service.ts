import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { Prisma, prisma } from "@crypto-payments/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { config } from "../config";

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

    static async verifyTOTP(
        sellerId: string,
        code: string,
        backupCode: string,
        context: string
    ): Promise<boolean> {
        const seller = await prisma.seller.findUnique({
            where: { id: sellerId },
            select: { totpSecret: true, totpEnabled: true, backupCodes: true },
        });

        if (!seller || !seller.totpSecret || !seller.totpEnabled) {
            return false;
        }

        let valid: boolean = false;

        if (backupCode && context === "LOGIN") {
            const isValidBackupCode = await this.verifyBackupCode(
                sellerId,
                backupCode
            );

            if (isValidBackupCode) return true;
        }

        valid = speakeasy.totp.verify({
            secret: seller.totpSecret,
            encoding: "base32",
            token: code,
            window: 1,
        });

        return valid;
    }

    private static async verifyBackupCode(
        sellerId: string,
        inputCode: string
    ): Promise<boolean> {
        const unusedBackupCodes = await prisma.backupCode.findMany({
            where: {
                sellerId,
                usedAt: null,
            },
        });

        for (const backupCode of unusedBackupCodes) {
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

    static async markSessionVerified(
        req: any,
        context: "LOGIN" | "SENSITIVE_ACTION"
    ): Promise<void> {
        try {
            const session = req.session;

            if (context === "LOGIN") {
                session.user.is2FAVerified = true;
                session.user.requires2FA = false;
            } else if (context === "SENSITIVE_ACTION") {
                session.action2faVerifiedAt = Date.now();
            }

            await this.updateSession(req, session);
        } catch (error) {
            console.error("Session update failed:", error);
            throw new Error("Failed to update session");
        }
    }

    private static async updateSession(
        req: any,
        newSession: any
    ): Promise<void> {
        const isSecure = process.env.NODE_ENV === "production";

        const sessionToken = isSecure
            ? req.cookies["__Secure-authjs.session-token"]
            : req.cookies["authjs.session-token"];

        if (!sessionToken) throw new Error("Session token not found");

        const jwt = require("jsonwebtoken");
        const token = jwt.sign(newSession, config.authSecret, {
            expiresIn: "30d",
        });

        req.res.cookie(
            isSecure ? "__Secure-authjs.session-token" : "authjs.session-token",
            token,
            {
                httpOnly: true,
                secure: isSecure,
                sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000,
                path: "/",
            }
        );
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
