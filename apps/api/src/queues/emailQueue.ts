import { Queue, Worker, Job } from "bullmq";
import { config } from "../config";
import { EmailService } from "../services/email.service";

const connection = {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
};

export const emailQueue = new Queue("email", { connection });

export interface EmailVerificationJob {
    type: "email-verification";
    email: string;
    codeOrToken: string;
    isCode: boolean;
}

export interface PasswordResetJob {
    type: "password-reset";
    email: string;
    token: string;
}

export type EmailJobData = EmailVerificationJob | PasswordResetJob;

const emailService = new EmailService();

export const emailWorker = new Worker<EmailJobData>(
    "email",
    async (job: Job<EmailJobData>) => {
        console.log(
            `Processing email job: ${job.data.type} for ${job.data.email}`
        );

        try {
            switch (job.data.type) {
                case "email-verification":
                    await emailService.sendVerificationEmail(
                        job.data.email,
                        job.data.codeOrToken,
                        job.data.isCode
                    );
                    break;
                case "password-reset":
                    await emailService.sendPasswordResetEmail(
                        job.data.email,
                        job.data.token
                    );
                    break;
                default:
                    throw new Error(
                        `Unknown email job type: ${(job.data as any).type}`
                    );
            }

            console.log(
                `✅ Email sent successfully: ${job.data.type} to ${job.data.email}`
            );
        } catch (error) {
            console.error(`❌ Email job failed:`, error);
            throw error;
        }
    },
    {
        connection,
        concurrency: 5,
    }
);

emailWorker.on("completed", (job) => {
    console.log(`Email job ${job.id} completed successfully`);
});

emailWorker.on("failed", (job, err) => {
    console.error(`Email job ${job?.id} failed:`, err.message);
});

emailWorker.on("error", (err) => {
    console.error("Email worker error:", err);
});

export const addEmailVerificationJob = async (
    email: string,
    codeOrToken: string,
    isCode: boolean = false
) => {
    return await emailQueue.add(
        "email-verification",
        { type: "email-verification", email, codeOrToken, isCode },
        {
            attempts: 3,
            backoff: {
                type: "exponential",
            },
            removeOnComplete: 10,
            removeOnFail: 20,
        }
    );
};

export const addPasswordResetJob = async (email: string, token: string) => {
    return await emailQueue.add(
        "password-reset",
        { type: "password-reset", email, token },
        {
            attempts: 3,
            backoff: {
                type: "exponential",
            },
            removeOnComplete: 10,
            removeOnFail: 20,
        }
    );
};
