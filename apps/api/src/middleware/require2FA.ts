import { Request, Response, NextFunction } from "express";
import { Prisma, prisma } from "@crypto-payments/db";

export const require2FA = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const sellerId = req.session!.user?.id;
    if (!sellerId) return res.status(401).json({ error: "Unauthorized" });

    const seller = await prisma.seller.findUnique({
        where: { id: sellerId },
    });

    if (seller && seller.totpEnabled) {
        const verifiedAt = req.session?.action2faVerifiedAt || 0;
        const FIVE_MINUTES = 5 * 60 * 1000;

        if (Date.now() - verifiedAt > FIVE_MINUTES) {
            return res.status(403).json({
                error: "2FA_REQUIRED_FOR_ACTION",
                message: "2FA verification required for this action",
            });
        }
    }

    next();
};
