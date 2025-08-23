import { Router } from "express";
import { ChainStatusService } from "../services/chain-status.service";
import { ChainStatus } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth";

const router = Router();
const chainStatusService = new ChainStatusService();

const updateChainStatusSchema = z.object({
    status: z.nativeEnum(ChainStatus),
    maintenanceMessage: z.string().optional(),
});

router.use(requireAdmin);

router.get("/chains", async (req, res) => {
    try {
        const chains = await chainStatusService.getAllChains();
        res.json(chains);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.get("/chains/active", async (req, res) => {
    try {
        const chains = await chainStatusService.getActiveChains();
        res.json(chains);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.put("/chains/:chainId/status", async (req, res) => {
    try {
        const chainId = parseInt(req.params.chainId);
        const { status, maintenanceMessage } = updateChainStatusSchema.parse(
            req.body
        );

        const result = await chainStatusService.updateChainStatus(
            chainId,
            status,
            maintenanceMessage
        );
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: "Validation error",
                details: error.errors,
            });
        }
        res.status(400).json({ error: error.message });
    }
});

export default router;
