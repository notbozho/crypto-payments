import { Router } from "express";
import { prisma } from "@crypto-payments/db";
import bcrypt from "bcryptjs";

const router = Router();

router.post("/register", async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: "Password must be at least 6 characters",
            });
        }

        // Check if seller already exists
        const existingSeller = await prisma.seller.findUnique({
            where: { email },
        });

        if (existingSeller) {
            return res.status(409).json({
                error: "Seller already exists with this email",
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create seller
        const seller = await prisma.seller.create({
            data: {
                email,
                passwordHash,
                name: name || null,
                emailVerified: new Date(),
            },
        });

        res.status(201).json({
            message: "Seller registered successfully",
            seller: {
                id: seller.id,
                email: seller.email,
                name: seller.name,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
