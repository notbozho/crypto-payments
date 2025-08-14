import { getSession } from "@auth/express";
import type { NextFunction, Request, Response } from "express";
import { authConfig } from "../config";

export async function authenticatedUser(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const session =
        res.locals.session ?? (await getSession(req, authConfig)) ?? undefined;

    res.locals.session = session;
    req.session = session;

    if (session) {
        return next();
    }

    res.status(401).json({ message: "Not Authenticated" });
}

export async function currentSession(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const session = (await getSession(req, authConfig)) ?? undefined;
    res.locals.session = session;
    req.session = session;
    return next();
}
