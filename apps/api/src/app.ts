import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.route";
import totpRoutes from "./routes/totp.route";
import paymentRoutes from "./routes/payment.route";
import { authConfig, config } from "./config";
import { emailWorker } from "./queues/emailQueue";
import { EmailService } from "./services/email.service";
import { ExpressAuth } from "@auth/express";
import { createServer } from "http";
import { setupWebSocketServer } from "./websocket/server";
import { RealtimePaymentNotifier } from "./websocket/notifier";

declare global {
    var paymentNotifier: RealtimePaymentNotifier;
}

const app = express();
const httpServer = createServer(app);

const emailService = new EmailService();
emailService.testConnection();

const wsServer = setupWebSocketServer(httpServer);
const notifier = new RealtimePaymentNotifier(wsServer);

global.paymentNotifier = notifier;

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
morgan.token("headers", (req) => JSON.stringify(req.headers));

app.use(morgan("tiny"));
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.set("trust proxy", true);
app.use("/api/auth", ExpressAuth(authConfig));
app.use("/api", authRoutes);
app.use("/api/totp", totpRoutes);

app.use("/api/payments", paymentRoutes);

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

export default httpServer;
