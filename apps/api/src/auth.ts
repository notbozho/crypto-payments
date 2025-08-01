import { ExpressAuth } from "@auth/express";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "@auth/express/providers/credentials";
import { prisma } from "@crypto-payments/db";
import bcrypt from "bcryptjs";
import { config } from "./config";

export const auth = ExpressAuth({
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    debug: config.nodeEnv === "development",
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const seller = await prisma.seller.findUnique({
                    where: { email: credentials.email as string },
                });

                if (!seller?.passwordHash) return null;

                const isValid = await bcrypt.compare(
                    credentials.password as string,
                    seller.passwordHash
                );

                return isValid
                    ? {
                          id: seller.id,
                          email: seller.email,
                          name: seller.name,
                      }
                    : null;
            },
        }),
    ],
    trustHost: true,
});
