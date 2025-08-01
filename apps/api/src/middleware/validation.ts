import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validateBody = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const validatedData = schema.parse(req.body);
            req.body = validatedData;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                }));

                return res.status(400).json({
                    error: "Validation failed",
                    details: errors,
                });
            }

            console.error("Validation middleware error:", error);
            return res.status(500).json({
                error: "Internal server error",
            });
        }
    };
};

export const validateQuery = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const validatedData = schema.parse(req.query);
            req.query = validatedData;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                }));

                return res.status(400).json({
                    error: "Query validation failed",
                    details: errors,
                });
            }

            console.error("Query validation middleware error:", error);
            return res.status(500).json({
                error: "Internal server error",
            });
        }
    };
};
