import { PrismaClient, ChainStatus } from "@prisma/client";
import { SUPPORTED_CHAINS } from "@crypto-payments/shared";

const prisma = new PrismaClient();

async function seedChainStatuses() {
    const activeChains = Object.values(SUPPORTED_CHAINS).filter((c) => c.id);

    for (const chain of activeChains) {
        await prisma.chainStatusConfig.upsert({
            where: { id: chain.id },
            update: {},
            create: {
                id: chain.id,
                status: ChainStatus.ACTIVE,
            },
        });
    }

    console.log(`✅ Seeded ${activeChains.length} chain statuses`);
}

seedChainStatuses()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
