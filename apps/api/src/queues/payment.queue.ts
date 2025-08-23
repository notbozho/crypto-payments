// api/src/queues/payment.queue.ts

import { Queue, Worker } from "bullmq";
import { PaymentWorker } from "../workers/payment.worker";

const redisConnection = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
};

export const paymentQueue = new Queue("payment-processing", {
    connection: redisConnection,
});

const paymentWorker = new PaymentWorker();

export const worker = new Worker(
    "payment-processing",
    async (job) => {
        return await paymentWorker.process(job);
    },
    {
        connection: redisConnection,
        concurrency: 5,
    }
);

worker.on("completed", (job) => {
    console.log(`✅ Payment job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
    console.error(`❌ Payment job failed: ${job?.id}`, err);
});

export function addPaymentJob(data: {
    paymentLinkId: string;
    txHash: string;
    amount: string;
    blockNumber?: number;
}) {
    return paymentQueue.add("process-payment", data, {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
    });
}
