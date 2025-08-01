import { useState, useCallback } from "react";
import { ZodSchema, ZodError } from "zod";

export interface ValidationState<T> {
    data: Partial<T>;
    errors: Record<string, string>;
    isValid: boolean;
    hasErrors: boolean;
}

export function useValidation<T>(schema: ZodSchema<T>) {
    const [validationState, setValidationState] = useState<ValidationState<T>>({
        data: {},
        errors: {},
        isValid: false,
        hasErrors: false,
    });

    const validateField = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (fieldName: string, value: any, data: Partial<T>) => {
            try {
                // Create a partial schema for just this field
                const fullData = { ...data, [fieldName]: value };
                schema.parse(fullData);

                // Clear error for this field if validation passes
                setValidationState((prev) => ({
                    ...prev,
                    data: fullData,
                    errors: { ...prev.errors, [fieldName]: "" },
                    hasErrors: Object.values({
                        ...prev.errors,
                        [fieldName]: "",
                    }).some((error) => error !== ""),
                    isValid: Object.values({
                        ...prev.errors,
                        [fieldName]: "",
                    }).every((error) => error === ""),
                }));

                return true;
            } catch (error) {
                if (error instanceof ZodError) {
                    const fieldError = error.issues.find((err) =>
                        err.path.includes(fieldName)
                    );

                    if (fieldError) {
                        setValidationState((prev) => ({
                            ...prev,
                            data: { ...prev.data, [fieldName]: value },
                            errors: {
                                ...prev.errors,
                                [fieldName]: fieldError.message,
                            },
                            hasErrors: true,
                            isValid: false,
                        }));
                    }
                }
                return false;
            }
        },
        [schema]
    );

    const validateAll = useCallback(
        (data: Partial<T>) => {
            try {
                const validatedData = schema.parse(data);
                setValidationState({
                    data: validatedData,
                    errors: {},
                    isValid: true,
                    hasErrors: false,
                });
                return { success: true, data: validatedData, errors: {} };
            } catch (error) {
                if (error instanceof ZodError) {
                    const errors: Record<string, string> = {};
                    error.issues.forEach((err) => {
                        const fieldName = err.path.join(".");
                        errors[fieldName] = err.message;
                    });

                    setValidationState({
                        data,
                        errors,
                        isValid: false,
                        hasErrors: true,
                    });

                    return { success: false, data, errors };
                }
                return {
                    success: false,
                    data,
                    errors: { general: "Validation failed" },
                };
            }
        },
        [schema]
    );

    const clearErrors = useCallback(() => {
        setValidationState((prev) => ({
            ...prev,
            errors: {},
            hasErrors: false,
        }));
    }, []);

    const getFieldError = useCallback(
        (fieldName: string) => {
            return validationState.errors[fieldName] || "";
        },
        [validationState.errors]
    );

    const hasFieldError = useCallback(
        (fieldName: string) => {
            return Boolean(validationState.errors[fieldName]);
        },
        [validationState.errors]
    );

    return {
        validationState,
        validateField,
        validateAll,
        clearErrors,
        getFieldError,
        hasFieldError,
    };
}
