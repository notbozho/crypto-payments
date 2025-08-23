// api/src/routes/payment-link.route.ts

import { Router, Request } from "express";
import { authConfig } from "../config";
import { PaymentLinkService } from "../services/payment-link.service";
import { z } from "zod";
import { ChainType } from "@crypto-payments/shared";
import { PaymentStatus } from "@prisma/client";
import { authenticatedUser } from "../middleware/auth";

declare module "express-serve-static-core" {
    interface Request {
        session?: {
            user?: {
                id: string;
            };
            action2faVerifiedAt?: number;
        };
    }
}

const router = Router();
const paymentLinkService = new PaymentLinkService();

// Validation schemas
const createPaymentLinkSchema = z.object({
    chainId: z.number().int().positive(),
    tokenAddress: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/)
        .optional(),
    amountUSD: z.number().positive().min(1).max(1000000),
    description: z.string().max(500).optional(),
    expiresAt: z.string().datetime(),
    swapToStable: z.boolean().default(false),
    stablecoinAddress: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/)
        .optional(),
    slippageTolerance: z.number().min(0.1).max(50).default(5.0),
    minimumConfirmations: z.number().int().min(1).max(12).default(3),
});

const getPaymentLinksSchema = z.object({
    status: z.nativeEnum(PaymentStatus).optional(),
    chainId: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
    offset: z.coerce.number().int().min(0).default(0).optional(),
});

router.use(authenticatedUser);

const requireAuth = async (req: any, res: any, next: any) => {
    try {
        const session = req.session;
        if (!session?.user?.id) {
            return res.status(401).json({ error: "Authentication required" });
        }
        req.sellerId = session.user.id;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid authentication" });
    }
};

router.use(requireAuth);

router.post("/links", async (req, res) => {
    try {
        const validatedData = createPaymentLinkSchema.parse(req.body);

        const paymentLink = await paymentLinkService.createPaymentLink(
            req.session?.user?.id as string,
            {
                ...validatedData,
                expiresAt: new Date(validatedData.expiresAt),
            }
        );

        res.status(201).json({
            success: true,
            data: paymentLink,
        });
    } catch (error: any) {
        console.error("Create payment link error:", error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: "Validation error",
                details: error.errors,
            });
        }

        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});

// Get payment links (with filtering)
router.get("/links", async (req, res) => {
    try {
        const options = getPaymentLinksSchema.parse(req.query);

        const paymentLinks = await paymentLinkService.getPaymentLinks(
            req.session?.user?.id as string,
            options
        );

        res.json({
            success: true,
            data: paymentLinks,
            pagination: {
                limit: options.limit || 50,
                offset: options.offset || 0,
                hasMore: paymentLinks.length === (options.limit || 50),
            },
        });
    } catch (error: any) {
        console.error("Get payment links error:", error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: "Validation error",
                details: error.errors,
            });
        }

        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});

// Get specific payment link
router.get("/links/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== "string") {
            return res.status(400).json({
                success: false,
                error: "Invalid payment link ID",
            });
        }

        const paymentLink = await paymentLinkService.getPaymentLink(
            id,
            req.session?.user?.id as string
        );

        res.json({
            success: true,
            data: paymentLink,
        });
    } catch (error: any) {
        console.error("Get payment link error:", error);

        if (error.message === "Payment link not found") {
            return res.status(404).json({
                success: false,
                error: error.message,
            });
        }

        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});

// Cancel payment link
router.put("/links/:id/cancel", async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== "string") {
            return res.status(400).json({
                success: false,
                error: "Invalid payment link ID",
            });
        }

        const paymentLink = await paymentLinkService.cancelPaymentLink(
            id,
            req.session?.user?.id as string
        );

        res.json({
            success: true,
            data: paymentLink,
        });
    } catch (error: any) {
        console.error("Cancel payment link error:", error);

        if (error.message.includes("not found")) {
            return res.status(404).json({
                success: false,
                error: error.message,
            });
        }

        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});

router.get("/chains", async (req, res) => {
    try {
        const chains = await paymentLinkService.getAvailableChains();

        res.json({
            success: true,
            data: chains,
        });
    } catch (error: any) {
        console.error("Get chains error:", error);
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});

router.get("/stats", async (req, res) => {
    try {
        const stats = await paymentLinkService.getPaymentLinkStats(
            req.session?.user?.id as string
        );

        res.json({
            success: true,
            data: stats,
        });
    } catch (error: any) {
        console.error("Get payment stats error:", error);
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});

// Public endpoint - get payment link for payment (no auth required)
router.get("/public/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== "string") {
            return res.status(400).json({
                success: false,
                error: "Invalid payment link ID",
            });
        }

        const paymentLink = await paymentLinkService.getPublicPaymentLink(id);

        res.json({
            success: true,
            data: paymentLink,
        });
    } catch (error: any) {
        console.error("Get public payment link error:", error);

        if (
            error.message.includes("not found") ||
            error.message.includes("expired") ||
            error.message.includes("cancelled")
        ) {
            return res.status(404).json({
                success: false,
                error: error.message,
            });
        }

        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
