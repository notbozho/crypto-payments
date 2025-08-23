// store/create-payment.ts

import { create } from "zustand";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface ChainConfig {
    id: number;
    name: string;
    symbol: string;
    blockExplorer: string;
    supportedTokens: SupportedToken[];
}

export interface SupportedToken {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    isNative: boolean;
    isStablecoin: boolean;
}

interface CreatePaymentFormData {
    chainId: number | null;
    tokenAddress: string;
    amountUSD: string;
    description: string;
    expiryOption: "1_hour" | "3_days" | "7_days" | "30_days" | "custom";
    customExpiryDate: string;
    swapToStable: boolean;
    stablecoinAddress: string;
    slippageTolerance: number;
    minimumConfirmations: number;
}

interface ApiError {
    response?: {
        data?: {
            error?: string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            details?: any;
        };
    };
    message: string;
}

interface CreatePaymentState {
    // Form data
    formData: CreatePaymentFormData;

    // Available options
    availableChains: ChainConfig[];
    availableTokens: SupportedToken[];
    availableStablecoins: SupportedToken[];

    // UI State
    loading: {
        chains: boolean;
        create: boolean;
    };
    errors: {
        chains: string | null;
        create: string | null;
        form: Record<string, string>;
    };

    // Created payment link
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdPaymentLink: any | null;

    // Actions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFormData: (field: keyof CreatePaymentFormData, value: any) => void;
    setChain: (chainId: number) => void;
    setToken: (tokenAddress: string) => void;
    validateForm: () => boolean;
    calculateExpiryDate: () => string;
    fetchChains: () => Promise<void>;
    createPaymentLink: () => Promise<void>;
    reset: () => void;
    clearErrors: () => void;
}

const initialFormData: CreatePaymentFormData = {
    chainId: null,
    tokenAddress: "0x0000000000000000000000000000000000000000",
    amountUSD: "",
    description: "",
    expiryOption: "7_days",
    customExpiryDate: "",
    swapToStable: false,
    stablecoinAddress: "",
    slippageTolerance: 5.0,
    minimumConfirmations: 3,
};

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

export const useCreatePaymentStore = create<CreatePaymentState>((set, get) => ({
    formData: initialFormData,
    availableChains: [],
    availableTokens: [],
    availableStablecoins: [],

    loading: {
        chains: false,
        create: false,
    },

    errors: {
        chains: null,
        create: null,
        form: {},
    },

    createdPaymentLink: null,

    setFormData: (field, value) => {
        set((state) => ({
            formData: { ...state.formData, [field]: value },
            errors: {
                ...state.errors,
                form: { ...state.errors.form, [field]: "" },
            },
        }));
    },

    setChain: (chainId) => {
        const chain = get().availableChains.find((c) => c.id === chainId);
        if (!chain) return;

        const nativeToken = chain.supportedTokens.find((t) => t.isNative);
        const stablecoins = chain.supportedTokens.filter((t) => t.isStablecoin);

        set((state) => ({
            formData: {
                ...state.formData,
                chainId,
                tokenAddress:
                    nativeToken?.address ||
                    "0x0000000000000000000000000000000000000000",
                stablecoinAddress: stablecoins[0]?.address || "",
            },
            availableTokens: chain.supportedTokens,
            availableStablecoins: stablecoins,
        }));
    },

    setToken: (tokenAddress) => {
        set((state) => ({
            formData: { ...state.formData, tokenAddress },
        }));
    },

    validateForm: () => {
        const { formData } = get();
        const errors: Record<string, string> = {};

        if (!formData.chainId) {
            errors.chainId = "Please select a blockchain";
        }

        if (!formData.amountUSD || parseFloat(formData.amountUSD) <= 0) {
            errors.amountUSD = "Please enter a valid amount";
        }

        if (parseFloat(formData.amountUSD) > 1000000) {
            errors.amountUSD = "Amount cannot exceed $1,000,000";
        }

        if (formData.expiryOption === "custom" && !formData.customExpiryDate) {
            errors.customExpiryDate = "Please select a custom expiry date";
        }

        if (formData.expiryOption === "custom" && formData.customExpiryDate) {
            const expiryDate = new Date(formData.customExpiryDate);
            if (expiryDate <= new Date()) {
                errors.customExpiryDate = "Expiry date must be in the future";
            }
        }

        if (formData.swapToStable && !formData.stablecoinAddress) {
            errors.stablecoinAddress = "Please select a stablecoin";
        }

        set((state) => ({
            errors: { ...state.errors, form: errors },
        }));

        return Object.keys(errors).length === 0;
    },

    calculateExpiryDate: () => {
        const { formData } = get();
        const now = new Date();

        switch (formData.expiryOption) {
            case "1_hour":
                return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
            case "3_days":
                return new Date(
                    now.getTime() + 3 * 24 * 60 * 60 * 1000
                ).toISOString();
            case "7_days":
                return new Date(
                    now.getTime() + 7 * 24 * 60 * 60 * 1000
                ).toISOString();
            case "30_days":
                return new Date(
                    now.getTime() + 30 * 24 * 60 * 60 * 1000
                ).toISOString();
            case "custom":
                return new Date(formData.customExpiryDate).toISOString();
            default:
                return new Date(
                    now.getTime() + 7 * 24 * 60 * 60 * 1000
                ).toISOString();
        }
    },

    fetchChains: async () => {
        set((state) => ({
            loading: { ...state.loading, chains: true },
            errors: { ...state.errors, chains: null },
        }));

        try {
            const chains = await makeApiCall<ChainConfig[]>("/payments/chains");

            set((state) => ({
                availableChains: chains,
                loading: { ...state.loading, chains: false },
            }));
        } catch (error) {
            const errorMessage = handleApiError(error as ApiError);
            console.error("Failed to fetch chains:", error);

            set((state) => ({
                loading: { ...state.loading, chains: false },
                errors: { ...state.errors, chains: errorMessage },
            }));

            toast.error("Failed to load available chains", {
                description: errorMessage,
            });
        }
    },

    createPaymentLink: async () => {
        const { formData, validateForm, calculateExpiryDate } = get();

        if (!validateForm()) {
            toast.error("Please fix the form errors");
            return;
        }

        set((state) => ({
            loading: { ...state.loading, create: true },
            errors: { ...state.errors, create: null },
        }));

        try {
            const requestData = {
                chainId: formData.chainId!,
                tokenAddress:
                    formData.tokenAddress ===
                    "0x0000000000000000000000000000000000000000"
                        ? undefined
                        : formData.tokenAddress,
                amountUSD: parseFloat(formData.amountUSD),
                description: formData.description || undefined,
                expiresAt: calculateExpiryDate(),
                swapToStable: formData.swapToStable,
                stablecoinAddress: formData.swapToStable
                    ? formData.stablecoinAddress
                    : undefined,
                slippageTolerance: formData.slippageTolerance,
                minimumConfirmations: formData.minimumConfirmations,
            };

            const paymentLink = await makeApiCall("/payments/links", {
                method: "POST",
                body: JSON.stringify(requestData),
            });

            set((state) => ({
                createdPaymentLink: paymentLink,
                loading: { ...state.loading, create: false },
            }));

            toast.success("Payment link created successfully!");
        } catch (error) {
            const errorMessage = handleApiError(error as ApiError);
            console.error("Failed to create payment link:", error);

            set((state) => ({
                loading: { ...state.loading, create: false },
                errors: { ...state.errors, create: errorMessage },
            }));

            toast.error("Failed to create payment link", {
                description: errorMessage,
            });
        }
    },

    reset: () => {
        set({
            formData: initialFormData,
            createdPaymentLink: null,
            errors: { chains: null, create: null, form: {} },
        });
    },

    clearErrors: () => {
        set((state) => ({
            errors: { ...state.errors, create: null, form: {} },
        }));
    },
}));
