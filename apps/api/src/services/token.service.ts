import jwt from "jsonwebtoken";
import { config } from "../config";
import { prisma } from "@crypto-payments/db";
import crypto from "crypto";

export class TokenService {
    private static readonly CODE_EXPIRY_MINUTES = 15;

    // Generate email verification token
    static async generateEmailVerificationCode(
        sellerId: string,
        email: string
    ) {
        // Invalidate any existing verification tokens
        await prisma.emailToken.updateMany({
            where: {
                sellerId,
                type: "email-verification",
                used: false,
                code: { not: null },
            },
            data: { used: true },
        });

        const code = this.generateSixDigitCode();
        const expiresAt = new Date(
            Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000
        );

        const emailToken = await prisma.emailToken.create({
            data: {
                sellerId,
                email,
                code,
                type: "email-verification",
                expiresAt,
            },
        });

        return emailToken.code;
    }

    // Generate password reset token
    static async generatePasswordResetToken(sellerId: string, email: string) {
        await prisma.emailToken.updateMany({
            where: {
                sellerId,
                type: "password-reset",
                used: false,
                expiresAt: { gt: new Date() },
            },
            data: { used: true },
        });

        const tokenValue = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        const emailToken = await prisma.emailToken.create({
            data: {
                sellerId,
                email,
                token: tokenValue,
                type: "password-reset",
                expiresAt,
            },
        });

        return emailToken.token;
    }

    static async verifyEmailCode(code: string) {
        const emailToken = await prisma.emailToken.findFirst({
            where: { code },
            include: { seller: true },
        });

        if (!emailToken) {
            throw new Error("Invalid code");
        }

        if (emailToken.used) {
            throw new Error("Code already used");
        }

        if (emailToken.expiresAt < new Date()) {
            throw new Error("Code expired");
        }

        if (emailToken.type !== "email-verification") {
            throw new Error("Invalid code type");
        }

        // Mark token as used
        await prisma.emailToken.update({
            where: { id: emailToken.id },
            data: { used: true },
        });

        // Mark seller as verified
        await prisma.seller.update({
            where: { id: emailToken.sellerId },
            data: { emailVerified: new Date() },
        });

        return emailToken.seller;
    }

    // Verify password reset token
    static async verifyPasswordResetToken(token: string) {
        const emailToken = await prisma.emailToken.findUnique({
            where: { token },
            include: { seller: true },
        });

        if (!emailToken) {
            throw new Error("Invalid token");
        }

        if (emailToken.used) {
            throw new Error("Token already used");
        }

        if (emailToken.expiresAt < new Date()) {
            throw new Error("Token expired");
        }

        if (emailToken.type !== "password-reset") {
            throw new Error("Invalid token type");
        }

        return emailToken;
    }

    // Mark password reset token as used
    static async markPasswordResetTokenUsed(tokenId: string) {
        await prisma.emailToken.update({
            where: { id: tokenId },
            data: { used: true },
        });
    }

    private static generateSixDigitCode(): string {
        let code = "";
        for (let i = 0; i < 6; i++) {
            code += crypto.randomInt(0, 10).toString();
        }
        return code;
    }

    static async cleanupExpiredCodes() {
        await prisma.emailToken.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
                used: false,
            },
        });
    }
}
