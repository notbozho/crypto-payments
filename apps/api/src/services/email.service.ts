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

    async sendVerificationEmail(
        email: string,
        codeOrToken: string,
        isCode: boolean = false
    ) {
        if (isCode) {
            return await this.sendVerificationCode(email, codeOrToken);
        } else {
            return await this.sendVerificationLink(email, codeOrToken);
        }
    }

    private async sendVerificationCode(email: string, code: string) {
        const mailOptions = {
            from: config.email.from,
            to: email,
            subject: "Verify Your Email - CryptoPay",
            html: `
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                    <div style="background: #f8fafc; padding: 40px 20px; text-align: center;">
                        <h1 style="color: #1e293b; margin: 0 0 20px 0;">Welcome to CryptoPay!</h1>
                        <p style="color: #64748b; font-size: 16px; margin: 0 0 30px 0;">
                            Please use the verification code below to complete your registration:
                        </p>
                        
                        <div style="background: white; border: 2px dashed #e2e8f0; border-radius: 8px; padding: 30px; margin: 30px 0;">
                            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; font-family: monospace;">
                                ${code}
                            </div>
                        </div>
                        
                        <p style="color: #64748b; font-size: 14px; margin: 20px 0;">
                            This code will expire in <strong>15 minutes</strong>.
                        </p>
                        
                        <p style="color: #64748b; font-size: 14px; margin: 0;">
                            If you didn't create an account, please ignore this email.
                        </p>
                    </div>
                    
                    <div style="background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px;">
                        <p style="margin: 0;">
                            This is an automated message from CryptoPay. Please do not reply to this email.
                        </p>
                    </div>
                </div>
            `,
        };

        return await this.transporter.sendMail(mailOptions);
    }

    private async sendVerificationLink(email: string, token: string) {
        const verificationUrl = `${config.frontendUrl}/auth/verify-email?token=${token}`;

        const mailOptions = {
            from: config.email.from,
            to: email,
            subject: "Verify Your Email - CryptoPay",
            html: `
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                    <div style="background: #f8fafc; padding: 40px 20px; text-align: center;">
                        <h1 style="color: #1e293b; margin: 0 0 20px 0;">Welcome to CryptoPay!</h1>
                        <p style="color: #64748b; font-size: 16px; margin: 0 0 30px 0;">
                            Please verify your email address by clicking the link below:
                        </p>
                        
                        <a href="${verificationUrl}" 
                           style="background: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; margin: 20px 0;">
                            Verify Email Address
                        </a>
                        
                        <p style="color: #64748b; font-size: 14px; margin: 20px 0;">
                            This link will expire in <strong>24 hours</strong>.
                        </p>
                        
                        <p style="color: #64748b; font-size: 14px; margin: 0;">
                            If you didn't create an account, please ignore this email.
                        </p>
                    </div>
                    
                    <div style="background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px;">
                        <p style="margin: 0;">
                            This is an automated message from CryptoPay. Please do not reply to this email.
                        </p>
                    </div>
                </div>
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
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                    <div style="background: #f8fafc; padding: 40px 20px; text-align: center;">
                        <h1 style="color: #1e293b; margin: 0 0 20px 0;">Password Reset Request</h1>
                        <p style="color: #64748b; font-size: 16px; margin: 0 0 30px 0;">
                            You requested to reset your password. Click the link below to proceed:
                        </p>
                        
                        <a href="${resetUrl}" 
                           style="background: #dc2626; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; margin: 20px 0;">
                            Reset Password
                        </a>
                        
                        <p style="color: #64748b; font-size: 14px; margin: 20px 0;">
                            This link will expire in <strong>1 hour</strong>.
                        </p>
                        
                        <p style="color: #64748b; font-size: 14px; margin: 0;">
                            If you didn't request this, please ignore this email.
                        </p>
                    </div>
                    
                    <div style="background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px;">
                        <p style="margin: 0;">
                            This is an automated message from CryptoPay. Please do not reply to this email.
                        </p>
                    </div>
                </div>
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
