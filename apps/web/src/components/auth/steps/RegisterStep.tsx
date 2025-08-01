import React, { useState } from "react";
import { useRegistrationFlowStore } from "@/store/registrationFlow";
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
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export function RegisterStep() {
    const { register, loading, error, userData } = useRegistrationFlowStore();

    const [formData, setFormData] = useState({
        name: userData?.name || "",
        email: userData?.email || "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState<
        Record<string, string>
    >({});

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!formData.email) {
            errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = "Please enter a valid email address";
        }

        if (!formData.password) {
            errors.password = "Password is required";
        } else if (formData.password.length < 8) {
            errors.password = "Password must be at least 8 characters";
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            errors.password =
                "Password must contain uppercase, lowercase, and number";
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = "Passwords do not match";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const success = await register(
            formData.email,
            formData.password,
            formData.name || undefined
        );

        if (!success) {
            // Error is handled by the store
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));

        // Clear validation error when user starts typing
        if (validationErrors[field]) {
            setValidationErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle className="text-xl">Create your account</CardTitle>
                <CardDescription>
                    Enter your details to get started with CryptoPay
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Global Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Name Field */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Name (optional)</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Your full name"
                            value={formData.name}
                            onChange={(e) =>
                                handleInputChange("name", e.target.value)
                            }
                            disabled={loading}
                        />
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={(e) =>
                                handleInputChange("email", e.target.value)
                            }
                            disabled={loading}
                            className={
                                validationErrors.email ? "border-red-500" : ""
                            }
                            required
                        />
                        {validationErrors.email && (
                            <p className="text-red-500 text-xs">
                                {validationErrors.email}
                            </p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="At least 8 characters"
                                value={formData.password}
                                onChange={(e) =>
                                    handleInputChange(
                                        "password",
                                        e.target.value
                                    )
                                }
                                disabled={loading}
                                className={
                                    validationErrors.password
                                        ? "border-red-500 pr-10"
                                        : "pr-10"
                                }
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={loading}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-500" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-500" />
                                )}
                            </Button>
                        </div>
                        {validationErrors.password && (
                            <p className="text-red-500 text-xs">
                                {validationErrors.password}
                            </p>
                        )}
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                            Confirm Password
                        </Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={(e) =>
                                    handleInputChange(
                                        "confirmPassword",
                                        e.target.value
                                    )
                                }
                                disabled={loading}
                                className={
                                    validationErrors.confirmPassword
                                        ? "border-red-500 pr-10"
                                        : "pr-10"
                                }
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                                disabled={loading}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-500" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-500" />
                                )}
                            </Button>
                        </div>
                        {validationErrors.confirmPassword && (
                            <p className="text-red-500 text-xs">
                                {validationErrors.confirmPassword}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={handleSubmit}
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? "Creating account..." : "Create Account"}
                    </Button>
                </div>

                {/* Sign In Link */}
                <div className="mt-4 text-center text-sm">
                    Already have an account?{" "}
                    <Link
                        href="/auth/signin"
                        className="text-blue-600 hover:underline"
                    >
                        Sign in
                    </Link>
                </div>

                {/* Terms */}
                <div className="text-muted-foreground text-center text-xs text-balance mt-4">
                    By creating an account, you agree to our{" "}
                    <Link
                        href="/terms"
                        className="underline underline-offset-4 hover:text-primary"
                    >
                        Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                        href="/privacy"
                        className="underline underline-offset-4 hover:text-primary"
                    >
                        Privacy Policy
                    </Link>
                    .
                </div>
            </CardContent>
        </Card>
    );
}
