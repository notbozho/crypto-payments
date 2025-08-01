import nodemailer from "nodemailer";
import { config } from "../config";

export class EmailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config.email.host,
            port: config.email.port,
            auth: {
                user: config.email.user,
                pass: config.email.password,
            },
        });
    }

    async sendVerificationEmail(email: string, token: string) {
        const verificationUrl = `${config.frontendUrl}/auth/verify-email?token=${token}`;

        const mailOptions = {
            from: config.email.from,
            to: email,
            subject: "Verify Your Email - CryptoPay",
            html: `
        <h2>Welcome to CryptoPay!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Verify Email
        </a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      `,
        };

        return await this.transporter.sendMail(mailOptions);
    }

    async sendPasswordResetEmail(email: string, token: string) {
        const resetUrl = `${config.frontendUrl}/auth/reset-password?token=${token}`;

        const mailOptions = {
            from: config.email.from,
            to: email,
            subject: "Reset Your Password - CryptoPay",
            html: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetUrl}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
        };

        return await this.transporter.sendMail(mailOptions);
    }

    async testConnection() {
        try {
            await this.transporter.verify();
            console.log("✅ Email service connected successfully");
            return true;
        } catch (error) {
            console.error("❌ Email service connection failed:", error);
            return false;
        }
    }
}
