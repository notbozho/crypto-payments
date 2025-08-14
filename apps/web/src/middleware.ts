// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const PROTECTED_PATHS = ["/dashboard"];

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (!PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
        return NextResponse.next();
    }
    try {
        const res = await fetch(`${API_URL}/auth/session`, {
            headers: {
                cookie: req.headers.get("cookie") || "",
            },
            cache: "no-store",
        });
        if (!res.ok) {
            const signinUrl = new URL("/auth/signin", req.url);
            return NextResponse.redirect(signinUrl);
        }

        const session = await res.json();

        if (!session?.user) {
            const signinUrl = new URL("/auth/signin", req.url);
            return NextResponse.redirect(signinUrl);
        }

        if (session.user.requires2FA && !session.user.is2FAVerified) {
            const twofaUrl = new URL("/auth/2fa", req.url);
            twofaUrl.searchParams.set("context", "login");
            twofaUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(twofaUrl);
        }

        return NextResponse.next();
    } catch (err) {
        console.error("Middleware auth check failed:", err);
        const signinUrl = new URL("/auth/signin", req.url);
        return NextResponse.redirect(signinUrl);
    }
}

export const config = {
    matcher: ["/dashboard/:path*"],
};
