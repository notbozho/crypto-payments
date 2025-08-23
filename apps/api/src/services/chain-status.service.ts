// api/src/services/chain-status.service.ts

import { prisma } from "@crypto-payments/db";
import { SUPPORTED_CHAINS, getChainConfigById } from "@crypto-payments/shared";
import { ChainStatus } from "@prisma/client";

export class ChainStatusService {
    async getActiveChains() {
        const chainStatuses = await prisma.chainStatusConfig.findMany({
            where: { status: ChainStatus.ACTIVE },
        });

        return chainStatuses
            .map((status) => {
                try {
                    const config = getChainConfigById(status.id);
                    return {
                        ...config,
                        dbStatus: status.status,
                        maintenanceMessage: status.maintenanceMessage,
                        updatedAt: status.updatedAt,
                    };
                } catch (error) {
                    console.warn(
                        `Chain ${status.id} has status in DB but no config`
                    );
                    return null;
                }
            })
            .filter(Boolean);
    }

    async getAllChains() {
        const chainStatuses = await prisma.chainStatusConfig.findMany();

        return chainStatuses
            .map((status) => {
                try {
                    const config = getChainConfigById(status.id);
                    return {
                        ...config,
                        dbStatus: status.status,
                        maintenanceMessage: status.maintenanceMessage,
                        updatedAt: status.updatedAt,
                    };
                } catch (error) {
                    console.warn(
                        `Chain ${status.id} has status in DB but no config`
                    );
                    return null;
                }
            })
            .filter(Boolean);
    }

    async updateChainStatus(
        chainId: number,
        status: ChainStatus,
        maintenanceMessage?: string
    ) {
        // Verify chain exists in our config
        try {
            getChainConfigById(chainId);
        } catch (error) {
            throw new Error(
                `Chain ${chainId} is not configured in shared constants`
            );
        }

        return await prisma.chainStatusConfig.upsert({
            where: { id: chainId },
            update: {
                status,
                maintenanceMessage,
                updatedAt: new Date(),
            },
            create: {
                id: chainId,
                status,
                maintenanceMessage,
            },
        });
    }

    async isChainActive(chainId: number): Promise<boolean> {
        const chainStatus = await prisma.chainStatusConfig.findUnique({
            where: { id: chainId },
        });
        return chainStatus?.status === ChainStatus.ACTIVE;
    }

    async getChainStatus(chainId: number) {
        return await prisma.chainStatusConfig.findUnique({
            where: { id: chainId },
        });
    }
}
