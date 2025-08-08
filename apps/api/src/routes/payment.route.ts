import { Router } from "express";
import { PaymentLinkService } from "../services/payment.service";
import {
    createPaymentLinkSchema,
    updateSellerWalletSchema,
} from "@crypto-payments/shared";
import { authenticatedUser } from "../middleware/auth";

declare module "express-serve-static-core" {
    interface Request {
        user?: {
            id: string;
            // add other user properties if needed
        };
    }
}

const router = Router();

// Update seller wallet
router.put("/seller/wallet", authenticatedUser, async (req, res) => {
    try {
        const validation = updateSellerWalletSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: validation.error.errors,
            });
        }

        await PaymentLinkService.updateSellerWallet(
            req.user!.id,
            validation.data.walletAddress
        );

        res.json({ success: true });
    } catch (error) {
        console.error("Failed to update wallet:", error);
        res.status(500).json({ error: "Failed to update wallet address" });
    }
});

// Create payment link
router.post("/", authenticatedUser, async (req, res) => {
    try {
        const validation = createPaymentLinkSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: validation.error.errors,
            });
        }

        const paymentLink = await PaymentLinkService.createPaymentLink(
            req.user!.id,
            validation.data
        );

        res.status(201).json({
            success: true,
            data: paymentLink,
        });
    } catch (error: any) {
        console.error("Payment link creation failed:", error);

        res.status(500).json({
            error: error.message || "Failed to create payment link",
        });
    }
});

// Get seller's payment links
router.get("/", authenticatedUser, async (req, res) => {
    try {
        const paymentLinks = await PaymentLinkService.getSellerPaymentLinks(
            req.user!.id
        );

        res.json({
            success: true,
            data: paymentLinks,
        });
    } catch (error) {
        console.error("Failed to get payment links:", error);
        res.status(500).json({
            error: "Failed to get payment links",
        });
    }
});

// Get specific payment link (public - for buyers)
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const paymentLink = await PaymentLinkService.getPaymentLink(id, false);

        if (!paymentLink) {
            return res.status(404).json({
                error: "Payment link not found",
            });
        }

        res.json({
            success: true,
            data: paymentLink,
        });
    } catch (error) {
        console.error("Failed to get payment link:", error);
        res.status(500).json({
            error: "Failed to get payment link",
        });
    }
});

export default router;
