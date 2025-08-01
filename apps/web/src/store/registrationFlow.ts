import { create } from "zustand";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export type RegistrationStep =
    | "register"
    | "verify-email"
    | "connect-wallet"
    | "2fa-setup"
    | "complete";

interface UserData {
    email: string;
    name?: string;
    id?: string;
}

interface RegistrationFlowState {
    // Current state
    currentStep: RegistrationStep;
    userData: UserData | null;
    loading: boolean;
    error: string | null;

    // Email verification specific
    codeExpiresAt: Date | null;
    resendCooldown: number; // seconds until can resend
    verificationAttempts: number;

    // Actions
    setStep: (step: RegistrationStep) => void;
    setUserData: (data: UserData) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // Registration flow actions
    register: (
        email: string,
        password: string,
        name?: string
    ) => Promise<boolean>;
    verifyCode: (code: string) => Promise<boolean>;
    resendCode: () => Promise<boolean>;
    updateEmail: (newEmail: string) => void;

    // Navigation
    goToNextStep: () => void;
    goToPreviousStep: () => void;
    goToStep: (step: RegistrationStep) => void;

    // Cleanup
    reset: () => void;

    // Timer management
    startCodeTimer: (expiresIn: number) => void;
    startResendCooldown: (seconds: number) => void;
}

export const useRegistrationFlowStore = create<RegistrationFlowState>(
    (set, get) => {
        let codeTimerInterval: NodeJS.Timeout | null = null;
        let resendCooldownInterval: NodeJS.Timeout | null = null;

        const clearTimers = () => {
            if (codeTimerInterval) {
                clearInterval(codeTimerInterval);
                codeTimerInterval = null;
            }
            if (resendCooldownInterval) {
                clearInterval(resendCooldownInterval);
                resendCooldownInterval = null;
            }
        };

        return {
            // Initial state
            currentStep: "register",
            userData: null,
            loading: false,
            error: null,
            codeExpiresAt: null,
            resendCooldown: 0,
            verificationAttempts: 0,

            // Basic setters
            setStep: (step) => set({ currentStep: step }),
            setUserData: (data) => set({ userData: data }),
            setLoading: (loading) => set({ loading }),
            setError: (error) => set({ error }),

            // Registration
            register: async (email, password, name) => {
                set({ loading: true, error: null });

                try {
                    const response = await fetch(`${API_URL}/register`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email, password, name }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                        set({
                            userData: {
                                email,
                                name,
                                id: data.seller.id,
                            },
                            currentStep: "verify-email",
                            verificationAttempts: 0,
                        });

                        // Start code expiration timer
                        get().startCodeTimer(data.codeExpiresIn || 900); // 15 minutes default
                        get().startResendCooldown(60); // 60 second cooldown

                        return true;
                    } else {
                        set({ error: data.error || "Registration failed" });
                        return false;
                    }
                } catch (error) {
                    console.error("Registration failed:", error);
                    set({ error: "Network error. Please try again." });
                    return false;
                } finally {
                    set({ loading: false });
                }
            },

            // Verify 6-digit code
            verifyCode: async (code) => {
                set({ loading: true, error: null });

                try {
                    const response = await fetch(`${API_URL}/verify-code`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ code }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                        clearTimers();
                        set({
                            currentStep: "connect-wallet",
                            codeExpiresAt: null,
                            resendCooldown: 0,
                        });
                        return true;
                    } else {
                        const attempts = get().verificationAttempts + 1;
                        set({
                            error: data.error || "Invalid code",
                            verificationAttempts: attempts,
                        });
                        return false;
                    }
                } catch (error) {
                    console.error("Code verification failed:", error);
                    set({ error: "Network error. Please try again." });
                    return false;
                } finally {
                    set({ loading: false });
                }
            },

            // Resend verification code
            resendCode: async () => {
                const { userData, resendCooldown } = get();

                if (resendCooldown > 0) {
                    set({
                        error: `Please wait ${resendCooldown} seconds before requesting a new code.`,
                    });
                    return false;
                }

                if (!userData?.email) {
                    set({
                        error: "Email not found. Please try registering again.",
                    });
                    return false;
                }

                set({ loading: true, error: null });

                try {
                    const response = await fetch(`${API_URL}/resend-code`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: userData.email }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                        set({ verificationAttempts: 0 });
                        get().startCodeTimer(data.codeExpiresIn || 900);
                        get().startResendCooldown(60);
                        return true;
                    } else {
                        set({ error: data.error || "Failed to resend code" });
                        return false;
                    }
                } catch (error) {
                    console.error("Resend code failed:", error);
                    set({ error: "Network error. Please try again." });
                    return false;
                } finally {
                    set({ loading: false });
                }
            },

            // Update email (when user wants to change it)
            updateEmail: (newEmail) => {
                const { userData } = get();
                if (userData) {
                    set({
                        userData: { ...userData, email: newEmail },
                        currentStep: "register", // Go back to register step
                        codeExpiresAt: null,
                        resendCooldown: 0,
                        verificationAttempts: 0,
                        error: null,
                    });
                    clearTimers();
                }
            },

            // Navigation
            goToNextStep: () => {
                const { currentStep } = get();
                const steps: RegistrationStep[] = [
                    "register",
                    "verify-email",
                    "connect-wallet",
                    "2fa-setup",
                    "complete",
                ];
                const currentIndex = steps.indexOf(currentStep);
                if (currentIndex < steps.length - 1) {
                    set({ currentStep: steps[currentIndex + 1] });
                }
            },

            goToPreviousStep: () => {
                const { currentStep } = get();
                const steps: RegistrationStep[] = [
                    "register",
                    "verify-email",
                    "connect-wallet",
                    "2fa-setup",
                    "complete",
                ];
                const currentIndex = steps.indexOf(currentStep);
                if (currentIndex > 0) {
                    set({ currentStep: steps[currentIndex - 1] });
                }
            },

            goToStep: (step) => {
                set({ currentStep: step });
            },

            // Timer management
            startCodeTimer: (expiresInSeconds) => {
                clearTimers();
                const expiresAt = new Date(
                    Date.now() + expiresInSeconds * 1000
                );
                set({ codeExpiresAt: expiresAt });

                codeTimerInterval = setInterval(() => {
                    const now = new Date();
                    if (now >= expiresAt) {
                        clearInterval(codeTimerInterval!);
                        set({ codeExpiresAt: null });
                    }
                }, 1000);
            },

            startResendCooldown: (seconds) => {
                set({ resendCooldown: seconds });

                resendCooldownInterval = setInterval(() => {
                    const current = get().resendCooldown;
                    if (current <= 1) {
                        clearInterval(resendCooldownInterval!);
                        set({ resendCooldown: 0 });
                    } else {
                        set({ resendCooldown: current - 1 });
                    }
                }, 1000);
            },

            // Reset everything
            reset: () => {
                clearTimers();
                set({
                    currentStep: "register",
                    userData: null,
                    loading: false,
                    error: null,
                    codeExpiresAt: null,
                    resendCooldown: 0,
                    verificationAttempts: 0,
                });
            },
        };
    }
);
