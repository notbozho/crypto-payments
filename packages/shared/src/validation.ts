import { z } from "zod";
import { ChainType } from "./types";

// Base schemas
export const emailSchema = z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address");

export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
    );

export const nameSchema = z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .optional();

// Auth schemas
export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    name: nameSchema,
});

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
    code: z.string().min(6, "Code is required"),
});

export const resendVerificationSchema = z.object({
    email: emailSchema,
});

export const forgotPasswordSchema = z.object({
    email: emailSchema,
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token is required"),
    newPassword: passwordSchema,
});

export const passwordConfirmSchema = z
    .object({
        password: passwordSchema,
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

export const createPaymentLinkSchema = z.object({
    amount: z.string().min(1, "Amount is required"),
    tokenAddress: z.string().min(1, "Token address is required"),
    chainType: z.nativeEnum(ChainType),
    description: z.string().max(500).optional(),
    expiresIn: z
        .number()
        .min(1)
        .max(30 * 24 * 60 * 60)
        .optional(), // Max 30 days in seconds
});

export const updateSellerWalletSchema = z.object({
    walletAddress: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type PasswordConfirmInput = z.infer<typeof passwordConfirmSchema>;
export type CreatePaymentLinkInput = z.infer<typeof createPaymentLinkSchema>;
export type UpdateSellerWalletInput = z.infer<typeof updateSellerWalletSchema>;
