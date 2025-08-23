// api/src/workers/payment.worker.ts

import { Job } from "bullmq";
import { prisma } from "@crypto-payments/db";

interface PaymentData {
    paymentLinkId: string;
    txHash: string;
    amount: string;
    blockNumber?: number;
}

export class PaymentWorker {
    async process(job: Job<PaymentData>) {
        console.log("Processing payment job:", job);
        const { paymentLinkId, txHash, amount } = job.data;
        const notifier = global.paymentNotifier;

        if (!notifier) {
            throw new Error("Payment notifier not available");
        }

        try {
            // Get payment link
            const paymentLink = await prisma.paymentLink.findUnique({
                where: { id: paymentLinkId },
                include: { seller: true },
            });

            if (!paymentLink) {
                throw new Error("Payment link not found");
            }

            const transaction = await prisma.transaction.create({
                data: {
                    paymentLinkId,
                    txHash,
                    amount: amount.toString(),
                    type: "PAYMENT_RECEIVED",
                    status: "PENDING",
                    fromAddress: "unknown",
                    toAddress: paymentLink.walletAddress,
                    blockNumber: BigInt(job.data.blockNumber || 0),
                    blockHash: "",
                    transactionIndex: 0,
                    gasUsed: BigInt(0),
                    gasPrice: BigInt(0),
                },
            });

            // Notify payment detected
            await notifier.notifyPaymentDetected(
                paymentLinkId,
                paymentLink.sellerId,
                {
                    txHash,
                    amount,
                    blockNumber: transaction.blockNumber.toString(),
                }
            );

            // Wait for confirmations with real-time updates
            let confirmations = 0;
            const requiredConfirmations = paymentLink.minimumConfirmations;

            while (confirmations < requiredConfirmations) {
                const receipt = await this.getTransactionReceipt(
                    txHash,
                    paymentLink.chainId
                );
                const currentBlock = await this.getCurrentBlockNumber(
                    paymentLink.chainId
                );
                confirmations = currentBlock - Number(receipt.blockNumber) + 1;

                // Update transaction
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        confirmations,
                        blockNumber: BigInt(receipt.blockNumber),
                        blockHash: receipt.blockHash,
                        gasUsed: BigInt(receipt.gasUsed),
                        gasPrice: BigInt(
                            receipt.effectiveGasPrice ?? receipt.gasPrice ?? 0
                        ),
                    },
                });

                // Notify confirmation progress
                await notifier.notifyPaymentConfirming(
                    paymentLinkId,
                    paymentLink.sellerId,
                    confirmations,
                    requiredConfirmations
                );

                if (confirmations < requiredConfirmations) {
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                }
            }

            // Update payment link status
            await prisma.paymentLink.update({
                where: { id: paymentLinkId },
                data: {
                    status: "PROCESSING",
                    actualAmountReceived: amount.toString(),
                    receivedAt: new Date(),
                },
            });

            // Execute operations with progress updates
            await notifier.notifyPaymentProcessing(
                paymentLinkId,
                paymentLink.sellerId,
                "initializing",
                10
            );

            // Transfer from ephemeral wallet
            await notifier.notifyPaymentProcessing(
                paymentLinkId,
                paymentLink.sellerId,
                "transferring_from_ephemeral",
                25
            );
            const transferResult = await this.transferFromEphemeralWallet(
                paymentLink,
                BigInt(amount)
            );

            let finalAmount = BigInt(amount);

            // Swap if enabled
            if (paymentLink.swapToStable) {
                await notifier.notifyPaymentProcessing(
                    paymentLinkId,
                    paymentLink.sellerId,
                    "swapping_tokens",
                    50
                );
                const swapResult = await this.executeSwap(
                    paymentLink,
                    finalAmount
                );
                finalAmount = swapResult.amountOut;
            }

            // Calculate fees and final amounts
            const totalGasCost = await this.calculateTotalGasCost(
                transferResult,
                paymentLink
            );
            const sellerAmount = finalAmount - totalGasCost;

            // Transfer to seller
            await notifier.notifyPaymentProcessing(
                paymentLinkId,
                paymentLink.sellerId,
                "transferring_to_seller",
                75
            );
            await this.transferToSeller(paymentLink, sellerAmount);

            // Transfer gas fee to platform
            await notifier.notifyPaymentProcessing(
                paymentLinkId,
                paymentLink.sellerId,
                "finalizing",
                90
            );
            await this.transferGasFeeToplatform(
                totalGasCost,
                paymentLink.chainId
            );

            // Update final status
            await prisma.paymentLink.update({
                where: { id: paymentLinkId },
                data: {
                    status: "COMPLETED",
                    completedAt: new Date(),
                },
            });

            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: "CONFIRMED",
                    confirmedAt: new Date(),
                },
            });

            // Final notification
            await notifier.notifyPaymentCompleted(
                paymentLinkId,
                paymentLink.sellerId,
                sellerAmount.toString(),
                totalGasCost.toString()
            );

            console.log(`✅ Payment completed: ${paymentLinkId}`);
        } catch (error: any) {
            // Update status to failed
            await prisma.paymentLink
                .update({
                    where: { id: paymentLinkId },
                    data: {
                        status: "FAILED",
                        errorMessage: error.message,
                    },
                })
                .catch(console.error);

            // Notify failure
            try {
                const paymentLink = await prisma.paymentLink.findUnique({
                    where: { id: paymentLinkId },
                });

                if (paymentLink) {
                    await notifier.notifyPaymentFailed(
                        paymentLinkId,
                        paymentLink.sellerId,
                        error.message
                    );
                }
            } catch (notifyError) {
                console.error("Failed to notify payment failure:", notifyError);
            }

            console.error(`❌ Payment failed: ${paymentLinkId}`, error);
            throw error;
        }
    }

    private async getTransactionReceipt(
        txHash: string,
        chainId: number
    ): Promise<{
        blockNumber: number | string;
        blockHash: string;
        gasUsed: number | string | bigint;
        gasPrice?: number | string | bigint;
        effectiveGasPrice?: number | string | bigint;
    }> {
        // TODO: Implement blockchain transaction receipt fetching
        // This should use your blockchain provider (Alchemy, Infura, etc.)
        // Mock return for type safety
        return {
            blockNumber: 0,
            blockHash: "",
            gasUsed: 0,
            gasPrice: 0,
            effectiveGasPrice: 0,
        };
        // throw new Error("getTransactionReceipt not implemented");
    }

    private async getCurrentBlockNumber(chainId: number): Promise<number> {
        // TODO: Implement current block number fetching
        throw new Error("getCurrentBlockNumber not implemented");
    }

    private async transferFromEphemeralWallet(
        paymentLink: any,
        amount: bigint
    ) {
        // TODO: Implement ephemeral wallet transfer
        throw new Error("transferFromEphemeralWallet not implemented");
    }

    private async executeSwap(
        paymentLink: any,
        amount: bigint
    ): Promise<{ amountOut: bigint }> {
        // TODO: Implement Uniswap swap
        throw new Error("executeSwap not implemented");
    }

    private async calculateTotalGasCost(
        transferResult: any,
        paymentLink: any
    ): Promise<bigint> {
        // TODO: Implement gas cost calculation
        return BigInt(0);
    }

    private async transferToSeller(paymentLink: any, amount: bigint) {
        // TODO: Implement transfer to seller
    }

    private async transferGasFeeToplatform(gasCost: bigint, chainId: number) {
        // TODO: Implement gas fee transfer to platform
    }
}
