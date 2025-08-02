import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { auth } from "./auth";
import authRoutes from "./routes/auth";
import totpRoutes from "./routes/totp";
import { config } from "./config";
import { emailWorker } from "./queues/emailQueue";
import { EmailService } from "./services/emailService";

const app = express();

const emailService = new EmailService();
emailService.testConnection();

// Middleware
app.use(helmet());
app.use(
    cors({
        origin: config.frontendUrl,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    })
);
app.use(morgan("combined"));
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", auth);
app.use("/api", authRoutes);
app.use("/api/totp", totpRoutes);

// Error handler
app.use(
    (
        err: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        console.error(err.stack);
        res.status(500).json({ error: "Something went wrong!" });
    }
);

process.on("SIGTERM", async () => {
    console.log("Shutting down email worker...");
    await emailWorker.close();
    process.exit(0);
});

export default app;
