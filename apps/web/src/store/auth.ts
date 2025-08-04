import { create } from "zustand";
import { persist } from "zustand/middleware";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface User {
    id: string;
    email: string;
    name?: string;
    emailVerified?: boolean;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;

    // Actions
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    forgotPassword: (
        email: string
    ) => Promise<{ success: boolean; message: string }>;
    resetPassword: (
        token: string,
        newPassword: string
    ) => Promise<{ success: boolean; message: string }>;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            loading: false,

            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setLoading: (loading) => set({ loading }),

            checkAuth: async () => {
                try {
                    set({ loading: true });
                    const response = await fetch(`${API_URL}/auth/session`, {
                        credentials: "include",
                    });

                    if (response.ok) {
                        const session = await response.json();
                        if (session?.user) {
                            set({ user: session.user, isAuthenticated: true });
                        } else {
                            set({ user: null, isAuthenticated: false });
                        }
                    } else {
                        set({ user: null, isAuthenticated: false });
                    }
                } catch (error) {
                    console.error("Auth check failed:", error);
                    set({ user: null, isAuthenticated: false });
                } finally {
                    set({ loading: false });
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

                    // Check if we're now authenticated
                    await get().checkAuth();
                    return get().isAuthenticated;
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
                    set({ user: null, isAuthenticated: false });
                }
            },
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
