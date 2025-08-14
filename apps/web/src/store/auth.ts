import { create } from "zustand";
import { persist } from "zustand/middleware";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type User = {
    id: string;
    email: string;
    name?: string;
    emailVerified?: boolean;
};

type AuthStatus =
    | "unknown"
    | "authenticated"
    | "unauthenticated"
    | "requires2fa";

type AuthState = {
    user: User | null;
    authStatus: AuthStatus;
    // isAuthenticated: boolean;
    loading: boolean;

    // Actions
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    verify2FA: (code?: string, backupCode?: string) => Promise<boolean>;
    refreshToken: () => Promise<void>;
    forgotPassword: (
        email: string
    ) => Promise<{ success: boolean; message: string }>;
    resetPassword: (
        token: string,
        newPassword: string
    ) => Promise<{ success: boolean; message: string }>;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            authStatus: "unknown",
            loading: false,

            setUser: (user) =>
                set({
                    user,
                    authStatus: user ? "authenticated" : "unauthenticated",
                }),
            setLoading: (loading) => set({ loading }),

            checkAuth: async () => {
                try {
                    set({ loading: true });
                    const response = await fetch(`${API_URL}/auth/session`, {
                        credentials: "include",
                        cache: "no-store",
                    });

                    if (response.ok) {
                        const session = await response.json();
                        if (session?.user) {
                            if (
                                session.user.requires2FA &&
                                !session.user.is2FAVerified
                            ) {
                                set({ user: null, authStatus: "requires2fa" });
                            } else {
                                if (session.expires) {
                                    const expiresAt = new Date(session.expires);
                                    if (expiresAt < new Date()) {
                                        set({
                                            user: null,
                                            authStatus: "unauthenticated",
                                        });
                                        await get().refreshToken();
                                        return;
                                    }
                                }

                                set({
                                    user: session.user,
                                    authStatus: "authenticated",
                                });
                            }
                        } else {
                            set({ user: null, authStatus: "unauthenticated" });
                        }
                    } else {
                        set({ user: null, authStatus: "unauthenticated" });
                    }
                } catch (error) {
                    console.error("Auth check failed:", error);
                    set({ user: null, authStatus: "unauthenticated" });
                } finally {
                    set({ loading: false });
                }
            },

            verify2FA: async (code?: string, backupCode?: string) => {
                try {
                    set({ loading: true });
                    const response = await fetch(`${API_URL}/totp/verify`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            code,
                            backupCode,
                            context: "LOGIN",
                        }),
                        credentials: "include",
                    });

                    if (response.ok) {
                        await get().checkAuth();
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error("2FA verification failed:", error);
                    return false;
                } finally {
                    set({ loading: false });
                }
            },

            refreshToken: async () => {
                try {
                    const res = await fetch(`${API_URL}/auth/session`, {
                        method: "POST",
                        credentials: "include",
                    });

                    if (res.ok) {
                        const session = await res.json();
                        set({ user: session.user });
                    }
                } catch (error) {
                    console.error("Token refresh failed:", error);
                }
            },
            login: async (email, password) => {
                try {
                    set({ loading: true });

                    // Get CSRF token
                    const csrfResponse = await fetch(`${API_URL}/auth/csrf`, {
                        credentials: "include",
                    });
                    const { csrfToken } = await csrfResponse.json();

                    // Perform login
                    const formData = new URLSearchParams();
                    formData.append("email", email);
                    formData.append("password", password);
                    formData.append("csrfToken", csrfToken);

                    await fetch(`${API_URL}/auth/callback/credentials`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                        body: formData,
                        credentials: "include",
                        redirect: "manual",
                    });

                    await get().checkAuth();
                    return get().authStatus === "authenticated";
                } catch (error) {
                    console.error("Login failed:", error);
                    return false;
                } finally {
                    set({ loading: false });
                }
            },
            forgotPassword: async (email) => {
                try {
                    const response = await fetch(`${API_URL}/forgot-password`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                        return { success: true, message: data.message };
                    } else {
                        return {
                            success: false,
                            message: data.error || "Failed to send reset email",
                        };
                    }
                } catch (error) {
                    console.error("Forgot password failed:", error);
                    return {
                        success: false,
                        message: "Network error. Please try again.",
                    };
                }
            },

            resetPassword: async (token, newPassword) => {
                try {
                    const response = await fetch(`${API_URL}/reset-password`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ token, newPassword }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                        return { success: true, message: data.message };
                    } else {
                        return {
                            success: false,
                            message: data.error || "Failed to reset password",
                        };
                    }
                } catch (error) {
                    console.error("Reset password failed:", error);
                    return {
                        success: false,
                        message: "Network error. Please try again.",
                    };
                }
            },

            logout: async () => {
                try {
                    await fetch(`${API_URL}/auth/signout`, {
                        method: "POST",
                        credentials: "include",
                    });
                } catch (error) {
                    console.error("Logout failed:", error);
                } finally {
                    set({ user: null, authStatus: "unauthenticated" });
                }
            },
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                user: state.user,
                authStatus: state.authStatus,
            }),
        }
    )
);
