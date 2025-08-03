import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export type RegistrationStep =
    | "register"
    | "verify-email"
    | "connect-wallet"
    | "2fa-setup"
    | "backup-codes"
    | "complete";

interface UserData {
    email: string;
    name?: string;
    id?: string;
}

interface TOTPSetupData {
    qrCode: string;
    manualEntryKey: string;
    backupCodes: string[];
    secret: string;
}

interface WalletData {
    address: string;
    type: string; // 'metamask' | 'walletconnect' | etc.
}

interface RegistrationFlowState {
    // Current state
    currentStep: RegistrationStep;
    userData: UserData | null;
    walletData: WalletData | null;
    loading: boolean;
    error: string | null;

    // Email verification specific
    codeExpiresAt: Date | null;
    resendCooldown: number; // seconds until can resend
    verificationAttempts: number;

    // 2FA specific
    totpSetupData: TOTPSetupData | null;
    has2FA: boolean;
    skipped2FA: boolean;

    // Actions
    setStep: (step: RegistrationStep) => void;
    setUserData: (data: UserData) => void;
    setWalletData: (data: WalletData) => void;
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

    // Wallet actions
    connectWallet: (walletData: WalletData) => void;
    skipWallet: () => void;

    // 2FA actions
    generateTOTPSetup: () => Promise<boolean>;
    verifyAndEnableTOTP: (token: string) => Promise<boolean>;
    skip2FA: () => void;
    complete2FA: () => void;

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

export const useRegistrationFlowStore = create<RegistrationFlowState>()(
    persist(
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
                walletData: null,
                loading: false,
                error: null,
                codeExpiresAt: null,
                resendCooldown: 0,
                verificationAttempts: 0,
                totpSetupData: null,
                has2FA: false,
                skipped2FA: false,

                // Basic setters
                setStep: (step) => set({ currentStep: step }),
                setUserData: (data) => set({ userData: data }),
                setWalletData: (data) => set({ walletData: data }),
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

                            await useAuthStore
                                .getState()
                                .login(email, password);

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
                                currentStep: "2fa-setup",
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
                            set({
                                error: data.error || "Failed to resend code",
                            });
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

                // Wallet connection
                connectWallet: (walletData) => {
                    set({
                        walletData,
                        currentStep: "2fa-setup",
                        error: null,
                    });
                },

                skipWallet: () => {
                    set({
                        currentStep: "2fa-setup",
                        error: null,
                    });
                },

                // 2FA Setup
                generateTOTPSetup: async () => {
                    const { userData } = get();

                    if (!userData?.email || !userData?.id) {
                        set({
                            error: "User data not found. Please try again.",
                        });
                        return false;
                    }

                    set({ loading: true, error: null });

                    try {
                        const response = await fetch(`${API_URL}/totp/setup`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                                email: userData.email,
                                sellerId: userData.id,
                            }),
                        });

                        const data = await response.json();

                        if (response.ok) {
                            set({ totpSetupData: data.data });
                            return true;
                        } else {
                            set({
                                error:
                                    data.error ||
                                    "Failed to generate 2FA setup",
                            });
                            return false;
                        }
                    } catch (error) {
                        console.error("TOTP setup failed:", error);
                        set({ error: "Network error. Please try again." });
                        return false;
                    } finally {
                        set({ loading: false });
                    }
                },

                verifyAndEnableTOTP: async (token) => {
                    const { userData, totpSetupData } = get();

                    if (!totpSetupData) {
                        set({
                            error: "No setup data found. Please try again.",
                        });
                        return false;
                    }

                    if (!userData?.id) {
                        set({
                            error: "User data not found. Please try again.",
                        });
                        return false;
                    }

                    set({ loading: true, error: null });

                    try {
                        const response = await fetch(`${API_URL}/totp/enable`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                                secret: totpSetupData.secret,
                                token,
                                backupCodes: totpSetupData.backupCodes,
                                sellerId: userData.id,
                            }),
                        });

                        const data = await response.json();

                        if (response.ok) {
                            set({
                                has2FA: true,
                                currentStep: "backup-codes",
                            });
                            return true;
                        } else {
                            set({
                                error: data.error || "Failed to enable 2FA",
                            });
                            return false;
                        }
                    } catch (error) {
                        console.error("TOTP verification failed:", error);
                        set({ error: "Network error. Please try again." });
                        return false;
                    } finally {
                        set({ loading: false });
                    }
                },

                skip2FA: () => {
                    set({
                        skipped2FA: true,
                        currentStep: "complete",
                        error: null,
                    });
                },

                complete2FA: () => {
                    set({
                        has2FA: true,
                        currentStep: "complete",
                        error: null,
                    });
                },
                goToNextStep: () => {
                    const { currentStep } = get();
                    const steps: RegistrationStep[] = [
                        "register",
                        "verify-email",
                        "connect-wallet",
                        "2fa-setup",
                        "backup-codes",
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
                        "backup-codes",
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

                reset: () => {
                    clearTimers();
                    set({
                        currentStep: "register",
                        userData: null,
                        walletData: null,
                        loading: false,
                        error: null,
                        codeExpiresAt: null,
                        resendCooldown: 0,
                        verificationAttempts: 0,
                        totpSetupData: null,
                        has2FA: false,
                        skipped2FA: false,
                    });
                },
            };
        },
        {
            name: "registration-flow",
            partialize: (state) => ({
                currentStep: state.currentStep,
                userData: state.userData,
                walletData: state.walletData,
                totpSetupData: state.totpSetupData,
                has2FA: state.has2FA,
                skipped2FA: state.skipped2FA,
            }),
        }
    )
);
