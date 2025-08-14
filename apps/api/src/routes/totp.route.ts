import { Router } from "express";
import { TOTPService } from "../services/totp.service";
import { prisma } from "@crypto-payments/db";
import { validateBody } from "../middleware/validation";
import { z } from "zod";
import { authenticatedUser } from "../middleware/auth";

const router = Router();

const setupTOTPSchema = z.object({
    email: z.string().email(),
    sellerId: z.string().optional(),
});

const verifyTOTPSetupSchema = z.object({
    secret: z.string().min(32),
    token: z.string().length(6),
    backupCodes: z.array(z.string()).length(8),
    sellerId: z.string().optional(),
});

const verifyTOTPSchema = z.object({
    code: z.string().length(6).optional(),
    backupCode: z.string().length(8).optional(),
    context: z.string(),
});

router.post(
    "/setup",
    authenticatedUser,
    validateBody(setupTOTPSchema),
    async (req, res) => {
        try {
            const sellerId = req.session!.user?.id;

            if (!sellerId) {
                return res.status(400).json({
                    error: "Invalid session or seller ID",
                });
            }

            const seller = await prisma.seller.findUnique({
                where: { id: sellerId },
                select: { totpEnabled: true, email: true },
            });

            if (!seller) {
                return res.status(400).json({
                    error: "Invalid session or seller ID",
                });
            }

            if (seller?.totpEnabled) {
                return res.status(400).json({
                    error: "2FA is already enabled for this account",
                });
            }

            const setupData = await TOTPService.generateTOTPSetup(
                sellerId,
                seller.email
            );

            res.json({
                message: "TOTP setup data generated",
                data: {
                    qrCode: setupData.qrCode,
                    manualEntryKey: setupData.manualEntryKey,
                    backupCodes: setupData.backupCodes,
                    secret: setupData.secret,
                },
            });
        } catch (error) {
            console.error("TOTP setup error:", error);
            res.status(500).json({ error: "Failed to generate 2FA setup" });
        }
    }
);

router.post(
    "/enable",
    authenticatedUser,
    validateBody(verifyTOTPSetupSchema),
    async (req, res) => {
        try {
            const { secret, code, backupCodes } = req.body;
            const sellerId = req.session!.user?.id;

            if (!sellerId) {
                return res.status(400).json({
                    error: "Invalid session or seller ID",
                });
            }

            const isValidToken = TOTPService.verifyTOTPSetup(secret, code);

            if (!isValidToken) {
                return res.status(400).json({
                    error: "Invalid verification code. Please try again.",
                });
            }

            await TOTPService.enableTOTP(sellerId, secret, backupCodes);

            res.json({
                message: "2FA has been successfully enabled for your account",
                enabled: true,
            });
        } catch (error) {
            console.error("Enable TOTP error:", error);
            res.status(500).json({ error: "Failed to enable 2FA" });
        }
    }
);

router.post(
    "/verify",
    authenticatedUser,
    validateBody(verifyTOTPSchema),
    async (req, res) => {
        try {
            const { code, backupCode, context } = req.body;
            const sellerId = req.session!.user?.id;

            if (!sellerId) {
                return res.status(401).json({
                    error: "Authentication required",
                });
            }

            if (context === "SENSITIVE_ACTION" && backupCode) {
                return res.status(400).json({
                    error: "Backup codes not allowed for sensitive actions",
                });
            }

            if (!code && !backupCode) {
                return res
                    .status(400)
                    .json({ error: "Code or backup code required" });
            }

            const isValid = await TOTPService.verifyTOTP(
                sellerId,
                code,
                backupCode,
                context
            );

            if (!isValid) {
                return res.status(400).json({
                    error: "Invalid verification code",
                });
            }

            await TOTPService.markSessionVerified(req, context);

            res.json({
                message: "TOTP verification successful",
                verified: true,
            });
        } catch (error) {
            console.error("Verify TOTP error:", error);
            res.status(500).json({ error: "TOTP verification failed" });
        }
    }
);

router.post("/regenerate-backup", authenticatedUser, async (req, res) => {
    try {
        const sellerId = req.session!.user?.id;

        if (!sellerId) {
            return res.status(401).json({
                error: "Authentication required",
            });
        }

        // Check if 2FA is enabled
        const seller = await prisma.seller.findUnique({
            where: { id: sellerId },
            select: { totpEnabled: true },
        });

        if (!seller?.totpEnabled) {
            return res.status(400).json({
                error: "2FA must be enabled to regenerate backup codes",
            });
        }

        const newBackupCodes = await TOTPService.regenerateBackupCodes(
            sellerId
        );

        res.json({
            message: "New backup codes generated",
            backupCodes: newBackupCodes,
        });
    } catch (error) {
        console.error("Regenerate backup codes error:", error);
        res.status(500).json({ error: "Failed to regenerate backup codes" });
    }
});

router.post("/disable", authenticatedUser, async (req, res) => {
    try {
        const sellerId = req.session!.user?.id;

        if (!sellerId) {
            return res.status(401).json({
                error: "Authentication required",
            });
        }

        await TOTPService.disableTOTP(sellerId);

        res.json({
            message: "2FA has been disabled",
            enabled: false,
        });
    } catch (error) {
        console.error("Disable TOTP error:", error);
        res.status(500).json({ error: "Failed to disable 2FA" });
    }
});

router.get("/status", authenticatedUser, async (req, res) => {
    try {
        const sellerId = req.session!.user?.id;

        if (!sellerId) {
            return res.status(401).json({
                error: "Authentication required",
            });
        }

        const seller = await prisma.seller.findUnique({
            where: { id: sellerId },
            select: { totpEnabled: true },
        });

        const remainingBackupCodes = seller?.totpEnabled
            ? await TOTPService.getRemainingBackupCodes(sellerId)
            : 0;

        res.json({
            enabled: seller?.totpEnabled || false,
            remainingBackupCodes,
        });
    } catch (error) {
        console.error("Get TOTP status error:", error);
        res.status(500).json({ error: "Failed to get 2FA status" });
    }
});

export default router;
