import { create } from "zustand";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface Transaction {
    id: string;
    paymentLinkId: string;
    amount: string;
    tokenAddress: string;
    chainType: string;
    fromAddress: string;
    toAddress: string;
    status: "pending" | "completed" | "failed" | "confirmed";
    txHash?: string;
    blockNumber?: number;
    createdAt: string;
    confirmedAt?: string;
    description?: string;
}

export interface PaymentLink {
    id: string;
    sellerId: string;
    amount: string;
    tokenAddress: string;
    chainType: string;
    description?: string;
    walletAddress: string;
    status: "pending" | "paid" | "confirmed" | "failed" | "expired";
    expiresAt?: string;
    createdAt: string;
    updatedAt: string;
    transactions?: Transaction[];
}

export interface DashboardStats {
    totalRevenue: {
        value: string;
        change: string;
        changeType: "increase" | "decrease";
    };
    activeLinks: {
        value: number;
        change: string;
        changeType: "increase" | "decrease";
    };
    totalTransactions: {
        value: number;
        change: string;
        changeType: "increase" | "decrease";
    };
    successRate: {
        value: string;
        change: string;
        changeType: "increase" | "decrease";
    };
}

interface ApiError {
    response: {
        data: {
            error: string;
        };
    };
    message: string;
}

interface DashboardState {
    // Data
    stats: DashboardStats | null;
    paymentLinks: PaymentLink[];
    transactions: Transaction[];

    // Loading states
    loading: {
        stats: boolean;
        paymentLinks: boolean;
        transactions: boolean;
        createLink: boolean;
        updateWallet: boolean;
    };

    // Error states
    errors: {
        stats: string | null;
        paymentLinks: string | null;
        transactions: string | null;
    };

    // Actions
    fetchPaymentLinks: () => Promise<void>;
    createPaymentLink: (data: {
        amount: string;
        tokenAddress: string;
        chainType: string;
        description?: string;
        expiresIn?: number;
    }) => Promise<PaymentLink>;
    updateSellerWallet: (walletAddress: string) => Promise<void>;
    getPaymentLink: (id: string) => Promise<PaymentLink | null>;

    // Computed stats from payment links
    computeStats: () => void;

    // Clear errors
    clearError: (type: "stats" | "paymentLinks" | "transactions") => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleApiError = (error: ApiError): string => {
    if (error.response?.data?.error) {
        return error.response.data.error;
    }
    if (error.message) {
        return error.message;
    }
    return "An unexpected error occurred";
};

const makeApiCall = async <T>(
    url: string,
    options: RequestInit = {}
): Promise<T> => {
    const response = await fetch(`${API_URL}${url}`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        ...options,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data.success ? data.data : data;
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
    // Initial state
    stats: null,
    paymentLinks: [],
    transactions: [],

    loading: {
        stats: false,
        paymentLinks: false,
        transactions: false,
        createLink: false,
        updateWallet: false,
    },

    errors: {
        stats: null,
        paymentLinks: null,
        transactions: null,
    },

    // Fetch payment links
    fetchPaymentLinks: async () => {
        set((state) => ({
            loading: { ...state.loading, paymentLinks: true },
            errors: { ...state.errors, paymentLinks: null },
        }));

        try {
            const paymentLinks = await makeApiCall<PaymentLink[]>(
                "/payments/links"
            );

            set((state) => ({
                paymentLinks,
                loading: { ...state.loading, paymentLinks: false },
            }));

            // Compute stats after fetching links
            get().computeStats();
        } catch (error) {
            const errorMessage = handleApiError(error as ApiError);
            console.error("Failed to fetch payment links:", error);

            set((state) => ({
                loading: { ...state.loading, paymentLinks: false },
                errors: { ...state.errors, paymentLinks: errorMessage },
            }));

            toast.error("Failed to load payment links", {
                description: errorMessage,
            });
        }
    },

    // Create payment link
    createPaymentLink: async (data) => {
        set((state) => ({
            loading: { ...state.loading, createLink: true },
        }));

        try {
            const paymentLink = await makeApiCall<PaymentLink>("/payments", {
                method: "POST",
                body: JSON.stringify(data),
            });

            set((state) => ({
                paymentLinks: [paymentLink, ...state.paymentLinks],
                loading: { ...state.loading, createLink: false },
            }));

            // Recompute stats
            get().computeStats();

            toast.success("Payment link created successfully!");
            return paymentLink;
        } catch (error) {
            const errorMessage = handleApiError(error as ApiError);
            console.error("Failed to create payment link:", error);

            set((state) => ({
                loading: { ...state.loading, createLink: false },
            }));

            toast.error("Failed to create payment link", {
                description: errorMessage,
            });

            throw error;
        }
    },

    // Update seller wallet
    updateSellerWallet: async (walletAddress) => {
        set((state) => ({
            loading: { ...state.loading, updateWallet: true },
        }));

        try {
            await makeApiCall("/payments/seller/wallet", {
                method: "PUT",
                body: JSON.stringify({ walletAddress }),
            });

            set((state) => ({
                loading: { ...state.loading, updateWallet: false },
            }));

            toast.success("Wallet address updated successfully!");
        } catch (error) {
            const errorMessage = handleApiError(error as ApiError);
            console.error("Failed to update wallet:", error);

            set((state) => ({
                loading: { ...state.loading, updateWallet: false },
            }));

            toast.error("Failed to update wallet address", {
                description: errorMessage,
            });

            throw error;
        }
    },

    // Get specific payment link
    getPaymentLink: async (id) => {
        try {
            const paymentLink = await makeApiCall<PaymentLink>(
                `/payments/${id}`
            );
            return paymentLink;
        } catch (error) {
            const errorMessage = handleApiError(error as ApiError);
            console.error("Failed to get payment link:", error);
            toast.error("Failed to load payment link", {
                description: errorMessage,
            });
            return null;
        }
    },

    // Compute stats from payment links
    computeStats: () => {
        const { paymentLinks } = get();

        const activeLinks = paymentLinks.filter(
            (link) => link.status === "pending" || link.status === "paid"
        ).length;

        const totalTransactions = paymentLinks.reduce(
            (sum, link) => sum + (link.transactions?.length || 0),
            0
        );

        const completedTransactions = paymentLinks.reduce(
            (sum, link) =>
                sum +
                (link.transactions?.filter((tx) => tx.status === "completed")
                    .length || 0),
            0
        );

        const successRate =
            totalTransactions > 0
                ? ((completedTransactions / totalTransactions) * 100).toFixed(1)
                : "0.0";

        // Calculate total revenue (this would need actual USD values)
        const totalRevenue = paymentLinks.reduce((sum, link) => {
            if (link.status === "paid" || link.status === "confirmed") {
                // You'd need to convert crypto amounts to USD here
                return sum + parseFloat(link.amount);
            }
            return sum;
        }, 0);

        const stats: DashboardStats = {
            totalRevenue: {
                value: `$${totalRevenue.toFixed(2)}`,
                change: "+12.5%", // You'd calculate this from historical data
                changeType: "increase",
            },
            activeLinks: {
                value: activeLinks,
                change: `+${Math.max(0, activeLinks - 5)}`, // Example calculation
                changeType: "increase",
            },
            totalTransactions: {
                value: totalTransactions,
                change: "+23%", // You'd calculate this from historical data
                changeType: "increase",
            },
            successRate: {
                value: `${successRate}%`,
                change: "+0.8%", // You'd calculate this from historical data
                changeType: "increase",
            },
        };

        set({ stats });
    },

    // Clear specific error
    clearError: (type) => {
        set((state) => ({
            errors: { ...state.errors, [type]: null },
        }));
    },
}));
