"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useValidation } from "@/hooks/useValidation";
import {
    passwordConfirmSchema,
    type PasswordConfirmInput,
} from "@crypto-payments/shared";
import { Mail, CheckCircle, XCircle } from "lucide-react";

interface SignUpForm extends PasswordConfirmInput {
    name?: string;
    email: string;
}

const signUpSchema = passwordConfirmSchema.extend({
    email: passwordConfirmSchema.shape.password,
    name: passwordConfirmSchema.shape.password.optional(),
});

export default function SignUpPage() {
    const [formData, setFormData] = useState<Partial<SignUpForm>>({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [submitError, setSubmitError] = useState("");
    const [success, setSuccess] = useState(false);

    const { register, loading } = useAuthStore();
    const router = useRouter();

    const {
        validationState,
        validateField,
        validateAll,
        getFieldError,
        hasFieldError,
    } = useValidation(signUpSchema);

    const handleFieldChange = (field: keyof SignUpForm, value: string) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        validateField(field, value, newData);
    };

    const ValidationMessage = ({
        field,
        children,
    }: {
        field: string;
        children: React.ReactNode;
    }) => {
        const error = getFieldError(field);
        const hasError = hasFieldError(field);
        const value = formData[field as keyof SignUpForm];

        if (!value || value.length === 0) return null;

        return (
            <div
                className={`flex items-center gap-2 text-sm mt-1 transition-colors ${
                    hasError ? "text-red-600" : "text-green-600"
                }`}
            >
                {hasError ? (
                    <XCircle className="h-4 w-4" />
                ) : (
                    <CheckCircle className="h-4 w-4" />
                )}
                <span>{hasError ? error : children}</span>
            </div>
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");

        const validation = validateAll(formData);

        if (!validation.success) {
            setSubmitError("Please fix the validation errors below");
            return;
        }

        const { name, email, password } = validation.data;
        const result = await register(email, password, name);

        if (result.success) {
            setSuccess(true);
        } else {
            setSubmitError(result.message || "Registration failed");
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <Mail className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                        <CardTitle className="text-2xl">
                            Check Your Email
                        </CardTitle>
                        <CardDescription>
                            We&apos;ve sent you a verification link
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-sm text-gray-600">
                            Please check your inbox at{" "}
                            <strong>{formData.email}</strong> and click the
                            verification link to activate your account.
                        </p>
                        <div className="space-y-2">
                            <Button asChild className="w-full">
                                <Link href="/auth/signin">Go to Sign In</Link>
                            </Button>
                            <Button
                                variant="outline"
                                asChild
                                className="w-full"
                            >
                                <Link href="/auth/resend-verification">
                                    Resend Verification
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">
                        Create account
                    </CardTitle>
                    <CardDescription className="text-center">
                        Enter your details to create your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {submitError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                                {submitError}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">Name (optional)</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Your name"
                                value={formData.name || ""}
                                onChange={(e) =>
                                    handleFieldChange("name", e.target.value)
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seller@example.com"
                                value={formData.email || ""}
                                onChange={(e) =>
                                    handleFieldChange("email", e.target.value)
                                }
                                className={
                                    formData.email && formData.email.length > 0
                                        ? hasFieldError("email")
                                            ? "border-red-500 focus:border-red-500"
                                            : "border-green-500 focus:border-green-500"
                                        : ""
                                }
                                required
                            />
                            <ValidationMessage field="email">
                                Valid email format
                            </ValidationMessage>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Create a strong password"
                                value={formData.password || ""}
                                onChange={(e) =>
                                    handleFieldChange(
                                        "password",
                                        e.target.value
                                    )
                                }
                                className={
                                    formData.password &&
                                    formData.password.length > 0
                                        ? hasFieldError("password")
                                            ? "border-red-500 focus:border-red-500"
                                            : "border-green-500 focus:border-green-500"
                                        : ""
                                }
                                required
                            />
                            <ValidationMessage field="password">
                                Strong password requirements met
                            </ValidationMessage>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                                Confirm Password
                            </Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm your password"
                                value={formData.confirmPassword || ""}
                                onChange={(e) =>
                                    handleFieldChange(
                                        "confirmPassword",
                                        e.target.value
                                    )
                                }
                                className={
                                    formData.confirmPassword &&
                                    formData.confirmPassword.length > 0
                                        ? hasFieldError("confirmPassword")
                                            ? "border-red-500 focus:border-red-500"
                                            : "border-green-500 focus:border-green-500"
                                        : ""
                                }
                                required
                            />
                            <ValidationMessage field="confirmPassword">
                                Passwords match
                            </ValidationMessage>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || !validationState.isValid}
                        >
                            {loading ? "Creating account..." : "Create Account"}
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm">
                        Already have an account?{" "}
                        <Link
                            href="/auth/signin"
                            className="text-blue-600 hover:underline"
                        >
                            Sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
