import { Router } from "express";
import { prisma } from "@crypto-payments/db";
import bcrypt from "bcryptjs";
import { TokenService } from "../services/tokenService";
import {
    addEmailVerificationJob,
    addPasswordResetJob,
} from "../queues/emailQueue";
import { validateBody } from "../middleware/validation";
import {
    registerSchema,
    verifyEmailSchema,
    resendVerificationSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    type RegisterInput,
    type VerifyEmailInput,
    type ResendVerificationInput,
    type ForgotPasswordInput,
    type ResetPasswordInput,
} from "@crypto-payments/shared";

const router = Router();

// Registration endpoint with validation
router.post("/register", validateBody(registerSchema), async (req, res) => {
    try {
        const { email, password, name }: RegisterInput = req.body;

        // Check if seller exists
        const existingSeller = await prisma.seller.findUnique({
            where: { email },
        });

        if (existingSeller) {
            return res.status(409).json({
                error: "An account with this email already exists",
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create seller (not verified yet)
        const seller = await prisma.seller.create({
            data: {
                email,
                passwordHash,
                name: name || null,
                emailVerified: null,
            },
        });

        const verificationCode =
            await TokenService.generateEmailVerificationCode(seller.id, email);

        if (!verificationCode) {
            return res.status(500).json({
                error: "Failed to generate verification code",
            });
        }

        // Queue verification email with code
        await addEmailVerificationJob(email, verificationCode, true);

        res.status(201).json({
            message:
                "Account created successfully. Please check your email to verify your account.",
            seller: {
                id: seller.id,
                email: seller.email,
                name: seller.name,
                emailVerified: false,
            },
            codeExpiresIn: 15 * 60, // 15 minutes in seconds
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Resend verification email
router.post(
    "/resend-code",
    validateBody(resendVerificationSchema),
    async (req, res) => {
        try {
            const { email }: ResendVerificationInput = req.body;

            const seller = await prisma.seller.findUnique({
                where: { email },
            });

            if (!seller) {
                return res.status(404).json({
                    error: "No account found with this email address.",
                });
            }

            if (seller.emailVerified) {
                return res
                    .status(400)
                    .json({ error: "Email address is already verified." });
            }

            // Generate new verification token
            const verificationToken =
                await TokenService.generateEmailVerificationCode(
                    seller.id,
                    email
                );

            if (!verificationToken) {
                return res.status(500).json({
                    error: "Failed to generate verification token.",
                });
            }

            // Queue verification email
            await addEmailVerificationJob(email, verificationToken, true);

            res.json({
                message: "New verification code sent! Please check your email.",
                codeExpiresIn: 15 * 60, // 15 minutes in seconds
            });
        } catch (error) {
            console.error("Resend verification error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

// Email verification endpoint
router.post(
    "/verify-code",
    validateBody(verifyEmailSchema),
    async (req, res) => {
        try {
            const { code }: VerifyEmailInput = req.body;

            const seller = await TokenService.verifyEmailCode(code);

            res.json({
                message:
                    "Email verified successfully! You can now sign in to your account.",
                seller: {
                    id: seller.id,
                    email: seller.email,
                    name: seller.name,
                    emailVerified: true,
                },
            });
        } catch (error: any) {
            console.error("Email verification error:", error);

            const errorMessages = {
                "Invalid code":
                    "The code you entered is incorrect. Please try again.",
                "Code already used":
                    "This code has already been used. Please request a new one.",
                "Code expired":
                    "This code has expired. Please request a new one.",
            };

            const message =
                errorMessages[error.message as keyof typeof errorMessages] ||
                "Verification failed. Please try again.";

            res.status(400).json({ error: message });
        }
    }
);

// Forgot password endpoint
router.post(
    "/forgot-password",
    validateBody(forgotPasswordSchema),
    async (req, res) => {
        try {
            const { email }: ForgotPasswordInput = req.body;

            const seller = await prisma.seller.findUnique({
                where: { email },
            });

            const successMessage =
                "If an account with that email exists, we've sent you a password reset link.";

            if (!seller) {
                return res.json({ message: successMessage });
            }

            // Generate reset token
            const resetToken = await TokenService.generatePasswordResetToken(
                seller.id,
                email
            );

            if (!resetToken) {
                return res.status(500).json({
                    error: "Failed to generate password reset token",
                });
            }

            // Queue password reset email
            await addPasswordResetJob(email, resetToken);

            res.json({ message: successMessage });
        } catch (error) {
            console.error("Forgot password error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

// Reset password endpoint
router.post(
    "/reset-password",
    validateBody(resetPasswordSchema),
    async (req, res) => {
        try {
            const { token, newPassword }: ResetPasswordInput = req.body;

            const emailToken = await TokenService.verifyPasswordResetToken(
                token
            );

            // Hash new password
            const passwordHash = await bcrypt.hash(newPassword, 12);

            // Update seller password
            await prisma.seller.update({
                where: { id: emailToken.sellerId },
                data: { passwordHash },
            });

            // Mark token as used
            await TokenService.markPasswordResetTokenUsed(emailToken.id);

            res.json({
                message:
                    "Password has been reset successfully. You can now sign in with your new password.",
            });
        } catch (error: any) {
            console.error("Reset password error:", error);

            const errorMessages = {
                "Invalid token":
                    "The password reset link is invalid or has been tampered with.",
                "Token already used":
                    "This password reset link has already been used.",
                "Token expired":
                    "The password reset link has expired. Please request a new one.",
            };

            const message =
                errorMessages[error.message as keyof typeof errorMessages] ||
                "Password reset failed. Please try again.";

            res.status(400).json({ error: message });
        }
    }
);

export default router;
