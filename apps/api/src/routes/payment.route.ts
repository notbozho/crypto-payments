import { Router } from "express";
import { PaymentLinkService } from "../services/payment.service";
import {
    createPaymentLinkSchema,
    updateSellerWalletSchema,
} from "@crypto-payments/shared";
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

export default router;
