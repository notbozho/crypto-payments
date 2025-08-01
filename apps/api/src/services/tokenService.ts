import jwt from "jsonwebtoken";
import { config } from "../config";
import { prisma } from "@crypto-payments/db";
import crypto from "crypto";

export class TokenService {
    // Generate email verification token
    static async generateEmailVerificationToken(
        sellerId: string,
        email: string
    ) {
        // Create a secure random token
        const tokenValue = crypto.randomBytes(32).toString("hex");

        // Store in database with expiration (24 hours)
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const emailToken = await prisma.emailToken.create({
            data: {
                sellerId,
                email,
                token: tokenValue,
                type: "email-verification",
                expiresAt,
            },
        });

        return emailToken.token;
    }

    // Generate password reset token
    static async generatePasswordResetToken(sellerId: string, email: string) {
        // Invalidate any existing password reset tokens
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

    static async verifyEmailToken(token: string) {
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

        if (emailToken.type !== "email-verification") {
            throw new Error("Invalid token type");
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
}
