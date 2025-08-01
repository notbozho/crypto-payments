import { Router } from "express";
import { prisma } from "@crypto-payments/db";
import bcrypt from "bcryptjs";
import { TokenService } from "../services/tokenService";
import {
    addEmailVerificationJob,
    addPasswordResetJob,
} from "../queues/emailQueue";

const router = Router();

router.post("/register", async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validation
        if (!email || !password) {
            return res
                .status(400)
                .json({ error: "Email and password required" });
        }

        if (password.length < 6) {
            return res
                .status(400)
                .json({ error: "Password must be at least 6 characters" });
        }

        const existingSeller = await prisma.seller.findUnique({
            where: { email },
        });

        if (existingSeller) {
            return res.status(409).json({ error: "Seller already exists" });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const seller = await prisma.seller.create({
            data: {
                email,
                passwordHash,
                name,
                emailVerified: null,
            },
        });

        const verificationToken =
            await TokenService.generateEmailVerificationToken(seller.id, email);

        await addEmailVerificationJob(email, verificationToken);

        res.status(201).json({
            message:
                "Account created successfully. Please check your email to verify your account.",
            seller: {
                id: seller.id,
                email: seller.email,
                name: seller.name,
                emailVerified: false,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/verify-email", async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: "Token required" });
        }

        const seller = await TokenService.verifyEmailToken(token);

        res.json({
            message: "Email verified successfully",
            seller: {
                id: seller.id,
                email: seller.email,
                name: seller.name,
                emailVerified: true,
            },
        });
    } catch (error: any) {
        console.error("Email verification error:", error);

        if (
            error.message === "Invalid token" ||
            error.message === "Token already used" ||
            error.message === "Token expired"
        ) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email required" });
        }

        const seller = await prisma.seller.findUnique({
            where: { email },
        });

        if (!seller) {
            return res.json({
                message:
                    "If an account with that email exists, a password reset link has been sent.",
            });
        }

        const resetToken = await TokenService.generatePasswordResetToken(
            seller.id,
            email
        );

        await addPasswordResetJob(email, resetToken);

        res.json({
            message:
                "If an account with that email exists, a password reset link has been sent.",
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res
                .status(400)
                .json({ error: "Token and new password required" });
        }

        if (newPassword.length < 6) {
            return res
                .status(400)
                .json({ error: "Password must be at least 6 characters" });
        }

        const emailToken = await TokenService.verifyPasswordResetToken(token);

        const passwordHash = await bcrypt.hash(newPassword, 12);

        await prisma.seller.update({
            where: { id: emailToken.sellerId },
            data: { passwordHash },
        });

        await TokenService.markPasswordResetTokenUsed(emailToken.id);

        res.json({ message: "Password reset successfully" });
    } catch (error: any) {
        console.error("Reset password error:", error);

        if (
            error.message === "Invalid token" ||
            error.message === "Token already used" ||
            error.message === "Token expired"
        ) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/resend-verification", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email required" });
        }

        const seller = await prisma.seller.findUnique({
            where: { email },
        });

        if (!seller) {
            return res.status(404).json({ error: "Seller not found" });
        }

        if (seller.emailVerified) {
            return res.status(400).json({ error: "Email already verified" });
        }

        const verificationToken =
            await TokenService.generateEmailVerificationToken(seller.id, email);

        await addEmailVerificationJob(email, verificationToken);

        res.json({ message: "Verification email sent" });
    } catch (error) {
        console.error("Resend verification error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
